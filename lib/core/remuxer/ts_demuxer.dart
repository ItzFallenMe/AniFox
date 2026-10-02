import 'dart:typed_data';

class PesPacket {
  final int streamType;
  final List<int> payload;
  final int? pts;
  final int? dts;

  PesPacket({
    required this.streamType,
    required this.payload,
    this.pts,
    this.dts,
  });
}

class TsDemuxer {
  int? pmtPid;
  int? vidPid;
  int? audPid;

  Map<int, int> streams = {}; // pid -> streamType

  List<PesPacket> process(Uint8List tsSegment) {
    final packets = _getPackets(tsSegment);
    final results = <PesPacket>[];

    final buffers = <int, BytesBuilder>{};
    // final ptsMap = <int, int?>{};
    // final dtsMap = <int, int?>{};

    for (final p in packets) {
      final pid = _getPid(p);
      if (pid == -1) continue;

      if (pid == 0x0000) {
        // PAT
        final pat = _getPAT(p);
        if (pat.isNotEmpty) {
          pmtPid = pat.values.first;
        }
      } else if (pmtPid != null && pid == pmtPid) {
        // PMT
        if (_checkPusi(p)) {
          final streamMap = _getPMT(p);
          if (streamMap.isNotEmpty) {
            streams = streamMap;
            streams.forEach((k, v) {
              if (v == 0x1B) vidPid = k; // H.264
              if (v == 0x0F) audPid = k; // AAC
            });
          }
        }
      } else if (streams.containsKey(pid)) {
        // Audio or Video
        final offset = _getPayloadOffset(p);
        if (offset < 0 || offset >= p.length) continue;

        final pusi = _checkPusi(p);

        if (pusi) {
          // New PES packet starting. Flush old one if exists.
          if (buffers.containsKey(pid) && buffers[pid]!.length > 0) {
            final rawPes = buffers[pid]!.toBytes();
            _extractAndAdd(rawPes, pid, streams[pid]!, results);
            buffers[pid]!.clear();
          } else {
            buffers[pid] = BytesBuilder();
          }
        }

        if (buffers.containsKey(pid)) {
          buffers[pid]!.add(p.sublist(offset));
        }
      }
    }

    // Flush remaining
    for (final pid in buffers.keys) {
      if (buffers[pid]!.length > 0) {
        final rawPes = buffers[pid]!.toBytes();
        _extractAndAdd(rawPes, pid, streams[pid]!, results);
      }
    }

    return results;
  }

  void _extractAndAdd(Uint8List rawPes, int pid, int streamType, List<PesPacket> results) {
    if (rawPes.length < 9) return;
    if (rawPes[0] != 0x00 || rawPes[1] != 0x00 || rawPes[2] != 0x01) return;

    final flags = rawPes[7];
    final headerDataLen = rawPes[8];

    final ptsDtsFlags = (flags >> 6) & 0x03;
    int? pts, dts;

    int offset = 9;
    if (ptsDtsFlags == 0x02 && headerDataLen >= 5) {
      pts = _parseTimestamp(rawPes, offset);
    } else if (ptsDtsFlags == 0x03 && headerDataLen >= 10) {
      pts = _parseTimestamp(rawPes, offset);
      dts = _parseTimestamp(rawPes, offset + 5);
    }

    final payloadStart = 9 + headerDataLen;
    if (payloadStart <= rawPes.length) {
      final payload = rawPes.sublist(payloadStart);
      results.add(PesPacket(
        streamType: streamType,
        payload: payload,
        pts: pts,
        dts: dts,
      ));
    }
  }

  List<Uint8List> _getPackets(Uint8List tsSegment) {
    const packetSize = 188;
    final List<Uint8List> packets = [];
    
    // Find the first valid sync byte (0x47) by verifying the next packet's sync byte
    int syncOffset = -1;
    for (int i = 0; i < tsSegment.length - packetSize; i++) {
      if (tsSegment[i] == 0x47) {
        if (i + packetSize < tsSegment.length && tsSegment[i + packetSize] == 0x47) {
          syncOffset = i;
          break;
        } else if (i + packetSize >= tsSegment.length) {
          syncOffset = i;
          break;
        }
      }
    }

    if (syncOffset == -1) return packets;

    for (int i = syncOffset; i + packetSize <= tsSegment.length; i += packetSize) {
      if (tsSegment[i] == 0x47) {
        packets.add(tsSegment.sublist(i, i + packetSize));
      } else {
        // Re-sync if we encounter garbage data in the middle of the stream
        syncOffset = -1;
        for (int j = i; j < tsSegment.length - packetSize; j++) {
           if (tsSegment[j] == 0x47 && (j + packetSize >= tsSegment.length || tsSegment[j + packetSize] == 0x47)) {
              syncOffset = j;
              break;
           }
        }
        if (syncOffset != -1) {
          i = syncOffset - packetSize;
        } else {
          break;
        }
      }
    }
    return packets;
  }

  int _getPid(Uint8List packet) {
    return ((packet[1] & 0x1F) << 8) | packet[2];
  }

  bool _checkPusi(Uint8List packet) {
    return (packet[1] & 0x40) != 0;
  }

  int _getPayloadOffset(Uint8List packet) {
    final containsAdaptation = (packet[3] & 0x20) != 0;
    final containsPayload = (packet[3] & 0x10) != 0;
    if (!containsPayload) return -1;

    int offset = 4;
    if (containsAdaptation) {
      final adaptationLength = packet[4];
      offset += 1 + adaptationLength;
    }
    return offset;
  }

  Map<int, int> _getPAT(Uint8List packet) {
    final offset = _getPayloadOffset(packet);
    if (offset < 0 || packet.length <= offset) return {};

    final payload = packet.sublist(offset);
    if (payload.isEmpty) return {};

    final pointerField = payload[0];
    int i = 1 + pointerField;
    if (i >= payload.length || payload[i] != 0x00) return {};

    final sectionLength = ((payload[i + 1] & 0x0F) << 8) | payload[i + 2];
    final sectionEnd = i + 3 + sectionLength;
    if (sectionEnd > payload.length) return {};

    final sectionData = payload.sublist(i, sectionEnd);
    i = 8;
    final programMap = <int, int>{};
    while (i + 4 <= sectionData.length - 4) {
      final programNumber = (sectionData[i] << 8) | sectionData[i + 1];
      final pid = ((sectionData[i + 2] & 0x1F) << 8) | sectionData[i + 3];
      if (programNumber != 0) programMap[programNumber] = pid;
      i += 4;
    }
    return programMap;
  }

  Map<int, int> _getPMT(Uint8List packet) {
    final offset = _getPayloadOffset(packet);
    if (offset < 0 || packet.length <= offset) return {};

    final payloadRaw = packet.sublist(offset);
    if (payloadRaw.isEmpty) return {};

    final pointerField = payloadRaw[0];
    if (pointerField + 1 >= payloadRaw.length) return {};

    final payload = payloadRaw.sublist(1 + pointerField);
    if (payload.isEmpty || payload[0] != 0x02) return {};

    final sectionLength = ((payload[1] & 0x0F) << 8) | payload[2];
    if (sectionLength < 12 || 3 + sectionLength > payload.length) return {};

    final sectionData = payload.sublist(0, 3 + sectionLength);

    int i = 10;
    final programInfoLength = ((sectionData[i] << 8) | sectionData[i + 1]) & 0x0FFF;
    i += 2 + programInfoLength;

    final streams = <int, int>{};
    while (i + 5 <= sectionData.length - 4) {
      final streamType = sectionData[i];
      final elementaryPid = (sectionData[i + 1] & 0x1F) << 8 | sectionData[i + 2];
      final esInfoLength = ((sectionData[i + 3] << 8) | sectionData[i + 4]) & 0x0FFF;
      streams[elementaryPid] = streamType;
      i += 5 + esInfoLength;
    }
    return streams;
  }

  int? _parseTimestamp(Uint8List packet, int offset) {
    if (packet.length < offset + 5) return null;
    final b0 = packet[offset];
    final b1 = packet[offset + 1];
    final b2 = packet[offset + 2];
    final b3 = packet[offset + 3];
    final b4 = packet[offset + 4];

    final timestamp = ((b0 & 0x0E) << 29) |
        (b1 << 22) |
        ((b2 & 0xFE) << 14) |
        (b3 << 7) |
        ((b4 & 0xFE) >> 1);
    return timestamp;
  }
}

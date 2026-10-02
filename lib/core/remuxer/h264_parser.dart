import 'dart:typed_data';

class SpsInfo {
  final int width;
  final int height;
  final double fps;

  SpsInfo(this.width, this.height, this.fps);
}

class BitReader {
  final List<int> bytes;
  int _byteOffset = 0;
  int _bitOffset = 0;

  BitReader(this.bytes);

  int readBit() {
    if (_byteOffset >= bytes.length) return 0;
    int bit = (bytes[_byteOffset] >> (7 - _bitOffset)) & 1;
    _bitOffset++;
    if (_bitOffset == 8) {
      _bitOffset = 0;
      _byteOffset++;
    }
    return bit;
  }

  int readBits(int n) {
    int val = 0;
    for (int i = 0; i < n; i++) {
      val = (val << 1) | readBit();
    }
    return val;
  }

  int readUe() {
    int zeroBits = 0;
    while (readBit() == 0 && _byteOffset < bytes.length) {
      zeroBits++;
    }
    if (zeroBits == 0) return 0;
    return (1 << zeroBits) - 1 + readBits(zeroBits);
  }

  int readSe() {
    int ue = readUe();
    int se = (ue + 1) ~/ 2;
    return (ue & 1) != 0 ? se : -se;
  }
}

class H264Parser {
  List<int>? sps;
  List<int>? pps;

  final BytesBuilder _buffer = BytesBuilder();
  int? _currentPts;
  int? _currentDts;
  SpsInfo? _spsInfo;

  /// Feeds a PES payload and returns a completed frame if a new frame starts.
  /// Call with `null` payload at the end to flush the last frame.
  ParsedH264Frame? processPes(List<int>? payload, int? pts, int? dts) {
    ParsedH264Frame? completedFrame;

    // If we have a new PTS and we already have data in the buffer, it means
    // the previous frame is complete.
    if (pts != null && _buffer.length > 0) {
      completedFrame = _parseBuffer(_buffer.toBytes(), _currentPts!, _currentDts!);
      _buffer.clear();
    }

    if (pts != null) {
      _currentPts = pts;
      _currentDts = dts ?? pts;
    }

    if (payload != null) {
      _buffer.add(payload);
    } else if (_buffer.length > 0 && _currentPts != null) {
      // Flush
      completedFrame = _parseBuffer(_buffer.toBytes(), _currentPts!, _currentDts!);
      _buffer.clear();
    }

    return completedFrame;
  }

  ParsedH264Frame _parseBuffer(List<int> payload, int pts, int dts) {
    final nals = <List<int>>[];
    int i = 0;

    // We must handle the case where the payload might not start with a start code immediately
    // Find first start code
    while (i < payload.length - 2) {
      if (payload[i] == 0x00 && payload[i + 1] == 0x00 && payload[i + 2] == 0x01) {
        break;
      }
      i++;
    }

    while (i < payload.length - 2) {
      if (payload[i] == 0x00 && payload[i + 1] == 0x00 && payload[i + 2] == 0x01) {
        int start = i + 3;
        i += 3;
        int nextStart = -1;
        for (int j = i; j < payload.length - 2; j++) {
          if (payload[j] == 0x00 && payload[j + 1] == 0x00 && payload[j + 2] == 0x01) {
            nextStart = j;
            break;
          }
        }

        int end = nextStart != -1 ? nextStart : payload.length;
        if (end > start && payload[end - 1] == 0x00) {
          end--; // Handle 00 00 00 01
        }
        
        nals.add(payload.sublist(start, end));
        i = nextStart != -1 ? nextStart : payload.length;
      } else {
        i++;
      }
    }

    bool isKeyframe = false;
    final outBuffer = BytesBuilder();

    for (final nal in nals) {
      if (nal.isEmpty) continue;
      final type = nal[0] & 0x1F;

      if (type == 7) {
        sps = nal;
        isKeyframe = true; // SPS often indicates a random access point in streaming formats
        _spsInfo ??= _parseSps(nal);
      }
      if (type == 8) {
        pps = nal;
        isKeyframe = true;
      }
      if (type == 5) isKeyframe = true;

      outBuffer.addByte((nal.length >> 24) & 0xFF);
      outBuffer.addByte((nal.length >> 16) & 0xFF);
      outBuffer.addByte((nal.length >> 8) & 0xFF);
      outBuffer.addByte(nal.length & 0xFF);
      outBuffer.add(nal);
    }

    return ParsedH264Frame(
      lengthPrefixedData: outBuffer.toBytes(),
      pts: pts,
      dts: dts,
      isKeyframe: isKeyframe,
    );
  }

  SpsInfo? get spsInfo => _spsInfo;

  SpsInfo? _parseSps(List<int> spsNal) {
    if (spsNal.length < 4) return null;

    final out = BytesBuilder();
    for (int i = 0; i < spsNal.length; i++) {
      if (i > 1 && spsNal[i] == 0x03 && spsNal[i - 1] == 0x00 && spsNal[i - 2] == 0x00) {
        continue;
      }
      out.addByte(spsNal[i]);
    }
    final cleanSps = out.toBytes();
    final reader = BitReader(cleanSps);

    reader.readBits(8); // NAL header

    int profileIdc = reader.readBits(8);
    reader.readBits(8); // constraint_set_flags
    
    // ignore: unused_local_variable
    int levelIdc = reader.readBits(8);
    reader.readUe(); // seq_parameter_set_id

    int chromaFormatIdc = 1;

    if (profileIdc == 100 || profileIdc == 110 || profileIdc == 122 || 
        profileIdc == 244 || profileIdc == 44 || profileIdc == 83 || 
        profileIdc == 86 || profileIdc == 118 || profileIdc == 128 || 
        profileIdc == 138 || profileIdc == 139 || profileIdc == 134 || profileIdc == 135) {
      chromaFormatIdc = reader.readUe();
      if (chromaFormatIdc == 3) reader.readBit(); // separate_colour_plane_flag
      reader.readUe(); // bit_depth_luma_minus8
      reader.readUe(); // bit_depth_chroma_minus8
      reader.readBit(); // qpprime_y_zero_transform_bypass_flag
      bool seqScalingMatrixPresent = reader.readBit() == 1;
      
      if (seqScalingMatrixPresent) {
        for (int i = 0; i < (chromaFormatIdc != 3 ? 8 : 12); i++) {
          bool seqScalingListPresent = reader.readBit() == 1;
          if (seqScalingListPresent) {
            int sizeOfScalingList = (i < 6) ? 16 : 64;
            int lastScale = 8;
            int nextScale = 8;
            for (int j = 0; j < sizeOfScalingList; j++) {
              if (nextScale != 0) {
                int deltaScale = reader.readSe();
                nextScale = (lastScale + deltaScale + 256) % 256;
              }
              lastScale = (nextScale == 0) ? lastScale : nextScale;
            }
          }
        }
      }
    }

    reader.readUe(); // log2_max_frame_num_minus4
    int picOrderCntType = reader.readUe();
    if (picOrderCntType == 0) {
      reader.readUe(); // log2_max_pic_order_cnt_lsb_minus4
    } else if (picOrderCntType == 1) {
      reader.readBit(); // delta_pic_order_always_zero_flag
      reader.readSe(); // offset_for_non_ref_pic
      reader.readSe(); // offset_for_top_to_bottom_field
      int numRefFramesInPicOrderCntCycle = reader.readUe();
      for (int i = 0; i < numRefFramesInPicOrderCntCycle; i++) {
        reader.readSe(); // offset_for_ref_frame
      }
    }
    
    reader.readUe(); // max_num_ref_frames
    reader.readBit(); // gaps_in_frame_num_value_allowed_flag
    
    int picWidthInMbsMinus1 = reader.readUe();
    int picHeightInMapUnitsMinus1 = reader.readUe();
    bool frameMbsOnlyFlag = reader.readBit() == 1;
    
    if (!frameMbsOnlyFlag) {
      reader.readBit(); // mb_adaptive_frame_field_flag
    }
    
    reader.readBit(); // direct_8x8_inference_flag
    bool frameCroppingFlag = reader.readBit() == 1;
    
    int frameCropLeftOffset = 0;
    int frameCropRightOffset = 0;
    int frameCropTopOffset = 0;
    int frameCropBottomOffset = 0;
    
    if (frameCroppingFlag) {
      frameCropLeftOffset = reader.readUe();
      frameCropRightOffset = reader.readUe();
      frameCropTopOffset = reader.readUe();
      frameCropBottomOffset = reader.readUe();
    }
    
    int width = (picWidthInMbsMinus1 + 1) * 16;
    int height = (picHeightInMapUnitsMinus1 + 1) * 16 * (2 - (frameMbsOnlyFlag ? 1 : 0));
    
    if (frameCroppingFlag) {
      int cropUnitX = 1;
      int cropUnitY = 2 - (frameMbsOnlyFlag ? 1 : 0);
      
      if (chromaFormatIdc == 1) { // 4:2:0
        cropUnitX = 2;
        cropUnitY = 2 * (2 - (frameMbsOnlyFlag ? 1 : 0));
      } else if (chromaFormatIdc == 2) { // 4:2:2
        cropUnitX = 2;
      }
      
      width -= (frameCropLeftOffset + frameCropRightOffset) * cropUnitX;
      height -= (frameCropTopOffset + frameCropBottomOffset) * cropUnitY;
    }

    double fps = 0.0;
    
    bool vuiParametersPresentFlag = reader.readBit() == 1;
    if (vuiParametersPresentFlag) {
      if (reader.readBit() == 1) { // aspect_ratio_info_present_flag
        if (reader.readBits(8) == 255) {
          reader.readBits(16);
          reader.readBits(16);
        }
      }
      if (reader.readBit() == 1) reader.readBit(); // overscan_info_present_flag
      if (reader.readBit() == 1) { // video_signal_type_present_flag
        reader.readBits(3);
        if (reader.readBit() == 1) { // colour_description_present_flag
          reader.readBits(8);
          reader.readBits(8);
          reader.readBits(8);
        }
      }
      if (reader.readBit() == 1) { // chroma_loc_info_present_flag
        reader.readUe();
        reader.readUe();
      }
      if (reader.readBit() == 1) { // timing_info_present_flag
        int numUnitsInTick = reader.readBits(32);
        int timeScale = reader.readBits(32);
        if (numUnitsInTick > 0) {
          fps = timeScale / (2 * numUnitsInTick);
        }
      }
    }
    
    return SpsInfo(width, height, fps);
  }

  List<int>? buildAvcc() {
    if (sps == null || pps == null || sps!.length < 4) return null;

    final avcc = BytesBuilder();
    avcc.addByte(1); // configurationVersion
    avcc.addByte(sps![1]); // AVCProfileIndication
    avcc.addByte(sps![2]); // profile_compatibility
    avcc.addByte(sps![3]); // AVCLevelIndication
    avcc.addByte(0xFF); // lengthSizeMinusOne = 3 (4 bytes)

    // SPS
    avcc.addByte(0xE1); // numOfSequenceParameterSets = 1
    avcc.addByte((sps!.length >> 8) & 0xFF);
    avcc.addByte(sps!.length & 0xFF);
    avcc.add(sps!);

    // PPS
    avcc.addByte(1); // numOfPictureParameterSets = 1
    avcc.addByte((pps!.length >> 8) & 0xFF);
    avcc.addByte(pps!.length & 0xFF);
    avcc.add(pps!);

    return avcc.toBytes();
  }
}

class ParsedH264Frame {
  final List<int> lengthPrefixedData;
  final int pts;
  final int dts;
  final bool isKeyframe;

  ParsedH264Frame({
    required this.lengthPrefixedData,
    required this.pts,
    required this.dts,
    required this.isKeyframe,
  });
}

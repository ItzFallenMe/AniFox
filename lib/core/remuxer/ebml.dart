import 'dart:convert';
import 'dart:typed_data';

class Ebml {
  static List<int> writeVint(int val) {
    if (val < (1 << 7) - 1) {
      return [0x80 | val];
    } else if (val < (1 << 14) - 1) {
      return [0x40 | (val >> 8), val & 0xFF];
    } else if (val < (1 << 21) - 1) {
      return [0x20 | (val >> 16), (val >> 8) & 0xFF, val & 0xFF];
    } else if (val < (1 << 28) - 1) {
      return [0x10 | (val >> 24), (val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF];
    } else if (val < (1 << 35) - 1) {
      return [0x08 | (val >> 32), (val >> 24) & 0xFF, (val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF];
    } else if (val < (1 << 42) - 1) {
      return [
        0x04 | (val >> 40),
        (val >> 32) & 0xFF,
        (val >> 24) & 0xFF,
        (val >> 16) & 0xFF,
        (val >> 8) & 0xFF,
        val & 0xFF
      ];
    } else if (val < (1 << 49) - 1) {
      return [
        0x02 | (val >> 48),
        (val >> 40) & 0xFF,
        (val >> 32) & 0xFF,
        (val >> 24) & 0xFF,
        (val >> 16) & 0xFF,
        (val >> 8) & 0xFF,
        val & 0xFF
      ];
    } else {
      return [
        0x01,
        (val >> 48) & 0xFF,
        (val >> 40) & 0xFF,
        (val >> 32) & 0xFF,
        (val >> 24) & 0xFF,
        (val >> 16) & 0xFF,
        (val >> 8) & 0xFF,
        val & 0xFF
      ];
    }
  }

  static List<int> writeId(int id) {
    final res = <int>[];
    if (id > 0xFFFFFF) res.add((id >> 24) & 0xFF);
    if (id > 0xFFFF) res.add((id >> 16) & 0xFF);
    if (id > 0xFF) res.add((id >> 8) & 0xFF);
    res.add(id & 0xFF);
    return res;
  }

  static List<int> writeData(int id, List<int> data) {
    return [
      ...writeId(id),
      ...writeVint(data.length),
      ...data,
    ];
  }

  static List<int> writeUint(int id, int val) {
    List<int> bytes = [];
    int temp = val;
    do {
      bytes.insert(0, temp & 0xFF);
      temp >>= 8;
    } while (temp > 0);
    return writeData(id, bytes);
  }

  static List<int> writeFloat(int id, double val) {
    final bdata = ByteData(8);
    bdata.setFloat64(0, val, Endian.big);
    return writeData(id, bdata.buffer.asUint8List());
  }

  static List<int> writeString(int id, String val) {
    return writeData(id, utf8.encode(val));
  }
}

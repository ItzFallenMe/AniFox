import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final src = img.decodePng(File('anifox_logo.png').readAsBytesSync())!;
  void save(String path, int size) {
    final out = img.copyResize(
      src,
      width: size,
      height: size,
      interpolation: img.Interpolation.linear,
    );
    File(path).writeAsBytesSync(img.encodePng(out, level: 9));
    stdout.writeln('$path ${out.width}x${out.height}');
  }

  save('assets/images/app_logo.png', 512);
  save('assets/images/app_icon.png', 1024);
}

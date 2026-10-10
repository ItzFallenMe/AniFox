import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:pointycastle/export.dart';

/// AllAnime request signing + response decryption.
///
/// Since mid-2026 the episode `sourceUrls` endpoint rejects plain queries
/// with `AA_CRYPTO_MISSING` and requires an `aaReq` token: AES-256-GCM over
/// `{v, ts, epoch, buildId, qh}` with a static site key, sent as a GET
/// `extensions` param alongside a persisted-query hash. Responses carry
/// `tobeparsed` blobs encrypted the same way.
///
/// Reference: ani-cli PR #1772. Verified live Oct 2026 (buildId 12 passes
/// the crypto gate; build 9 returns `AA_CRYPTO_MISSING_BUILD`).
///
/// If the site rotates `epoch`/`buildId` again, requests fail with
/// `AA_CRYPTO_MISSING_BUILD` — update the constants below (scrape them from
/// the site's JS bundle; see ani-cli#1774).
///
/// NOTE: AES-GCM is implemented directly on pointycastle's [GCMBlockCipher]
/// (with explicit `doFinal` tag handling) rather than through the `encrypt`
/// package, whose GCM stream path silently drops the 16-byte auth tag.
class AllAnimeCrypto {
  /// Static site key (hex). XOR-derived on the site; stable since the
  /// rotation that introduced aaReq.
  static const String keyHex =
      '22196fa6afca95309fdabe9a3534b87cd2454e50efeabfcbdbdfd3de678b3982';

  /// Persisted-query hash for `episode(showId, translationType,
  /// episodeString) { episodeString sourceUrls }`.
  static const String episodeQueryHash =
      'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec';

  static const int epoch = 4128;
  static const String buildId = '12';

  static Uint8List _keyBytes() {
    final hex = keyHex;
    final out = Uint8List(hex.length ~/ 2);
    for (int i = 0; i < out.length; i++) {
      out[i] = int.parse(hex.substring(i * 2, i * 2 + 2), radix: 16);
    }
    return out;
  }

  static GCMBlockCipher _cipher(bool forEncryption, Uint8List iv) {
    final c = GCMBlockCipher(AESEngine());
    c.init(
      forEncryption,
      AEADParameters(
        KeyParameter(_keyBytes()),
        128,
        iv,
        Uint8List(0),
      ),
    );
    return c;
  }

  /// AES-256-GCM encrypt. Returns ciphertext ++ 16-byte tag.
  static Uint8List gcmEncrypt(Uint8List plain, Uint8List iv) {
    return _cipher(true, iv).process(plain);
  }

  /// AES-256-GCM decrypt. Throws on auth failure.
  static Uint8List gcmDecrypt(Uint8List ctAndTag, Uint8List iv) {
    return _cipher(false, iv).process(ctAndTag);
  }

  /// 5-minute time window the server accepts.
  static int currentWindow() =>
      (DateTime.now().millisecondsSinceEpoch ~/ 300000) * 300000;

  /// Builds the `extensions` query param for episode source requests.
  static String buildExtensionsParam({int? windowMs}) {
    final ts = windowMs ?? currentWindow();
    final payload = jsonEncode({
      'v': 1,
      'ts': ts,
      'epoch': epoch,
      'buildId': buildId,
      'qh': episodeQueryHash,
    });
    final ivSeed = '$epoch:$buildId:$episodeQueryHash:$ts';
    final iv = Uint8List.fromList(
        sha256.convert(utf8.encode(ivSeed)).bytes.sublist(0, 12));
    final ctAndTag = gcmEncrypt(Uint8List.fromList(utf8.encode(payload)), iv);
    // [0x01] + iv + ct+tag, base64 — byte-identical to the site's own token.
    final token = Uint8List.fromList([0x01, ...iv, ...ctAndTag]);
    return jsonEncode({
      'persistedQuery': {'version': 1, 'sha256Hash': episodeQueryHash},
      'aaReq': base64Encode(token),
    });
  }

  /// Decrypts a `tobeparsed` payload from an episode response.
  /// Layout: `[0x??][12-byte iv][ciphertext][16-byte tag]`.
  static String decryptTobeparsed(String b64) {
    final raw = base64Decode(b64);
    if (raw.length < 1 + 12 + 16) {
      throw Exception('tobeparsed payload too short (${raw.length} bytes)');
    }
    final iv = Uint8List.fromList(raw.sublist(1, 13));
    final ctAndTag = Uint8List.fromList(raw.sublist(13));
    return utf8.decode(gcmDecrypt(ctAndTag, iv));
  }
}

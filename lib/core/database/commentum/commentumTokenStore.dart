import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Local replacement for the missing `commentum_client` token store contract.
///
/// The original file implemented `CommentumStorage`/`CommentumProvider` from
/// the external `commentum_client` package (a ShonenX submodule, not vendored
/// in AniFox). To keep `flutter analyze` clean and preserve behaviour, we
/// define the minimal contract locally and persist per-provider tokens in
/// secure storage.
enum CommentumProvider {
  anilist,
  mal,
  simkl,
  kitsu,
  discord,
}

abstract class CommentumStorage {
  Future<void> clearAll();
  Future<void> deleteToken(CommentumProvider provider);
  Future<String?> getToken(CommentumProvider provider);
  Future<void> saveToken(CommentumProvider provider, String token);
  Future<Map<CommentumProvider, String>> getAllTokens();
}

class CommentumTokenStore implements CommentumStorage {
  String _providerKey(CommentumProvider provider) => "commentum_${provider.name}_token";

  final _fss = const FlutterSecureStorage();

  @override
  Future<void> clearAll() async {
    for (final provider in CommentumProvider.values) {
      await _fss.delete(key: _providerKey(provider));
    }
  }

  @override
  Future<void> deleteToken(CommentumProvider provider) async {
    return await _fss.delete(key: _providerKey(provider));
  }

  @override
  Future<String?> getToken(CommentumProvider provider) async {
    final tkn = await _fss.read(key: _providerKey(provider));
    return tkn;
  }

  @override
  Future<void> saveToken(CommentumProvider provider, String token) async {
    return await _fss.write(key: _providerKey(provider), value: token);
  }

  @override
  Future<Map<CommentumProvider, String>> getAllTokens() {
    return Future.wait(CommentumProvider.values.map((provider) async {
      final token = await getToken(provider);
      return MapEntry(provider, token ?? "");
    })).then((entries) => Map.fromEntries(entries));
  }
}

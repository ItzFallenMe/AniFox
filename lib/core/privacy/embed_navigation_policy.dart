import 'package:anifox/streaming/models/stream_source.dart';

/// Restricts top-level WebView navigation to the selected embed provider and
/// AniFox's own API origin. Subframes are intentionally not evaluated here:
/// providers need to load their own player, CDN and media dependencies.
///
/// This is a navigation-security control, not an ad blocker. It does not
/// inspect or rewrite media, manifests, provider scripts or advertising.
class EmbedNavigationPolicy {
  const EmbedNavigationPolicy();

  bool allowsMainFrame({
    required String targetUrl,
    required StreamSource source,
    required String apiBaseUrl,
  }) {
    final target = Uri.tryParse(targetUrl);
    if (target == null ||
        !target.hasAuthority ||
        target.host.isEmpty ||
        target.userInfo.isNotEmpty) {
      return false;
    }

    final host = _normaliseHost(target.host);
    final secure = target.scheme.toLowerCase() == 'https';
    final localDevelopment =
        target.scheme.toLowerCase() == 'http' && _isLocalDevelopmentHost(host);

    if (!secure && !localDevelopment) return false;

    final providerUri = Uri.tryParse(source.baseUrl);
    final providerHost =
        providerUri == null ? '' : _normaliseHost(providerUri.host);

    final apiUri = Uri.tryParse(apiBaseUrl);
    final apiHost = apiUri == null ? '' : _normaliseHost(apiUri.host);

    final isProviderHost = providerHost.isNotEmpty &&
        (host == providerHost || host.endsWith('.$providerHost'));
    final isAniFoxApiHost = apiHost.isNotEmpty && host == apiHost;

    return isProviderHost || isAniFoxApiHost;
  }

  String _normaliseHost(String host) =>
      host.toLowerCase().replaceFirst(RegExp(r'\.+$'), '');

  bool _isLocalDevelopmentHost(String host) =>
      host == 'localhost' ||
      host == '127.0.0.1' ||
      host == '10.0.2.2' ||
      host == '::1';
}

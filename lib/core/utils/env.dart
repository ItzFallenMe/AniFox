// ignore_for_file: non_constant_identifier_names, constant_identifier_names

class Env {
  static const RELEASE_REPO = String.fromEnvironment('RELEASE_REPO');

  static const COMMENTUM_API_URL = String.fromEnvironment('COMMENTUM_API_URL');

  static const ANILIST_CLIENT_ID = String.fromEnvironment('ANILIST_CLIENT_ID');

  static const ANILIST_CLIENT_SECRET = String.fromEnvironment(
    'ANILIST_CLIENT_SECRET',
  );

  static const MAL_CLIENT_ID = String.fromEnvironment('MAL_CLIENT_ID');

  static const MAL_CLIENT_SECRET = String.fromEnvironment('MAL_CLIENT_SECRET');

  static const SIMKL_CLIENT_ID = String.fromEnvironment('SIMKL_CLIENT_ID');

  static const SIMKL_CLIENT_SECRET = String.fromEnvironment(
    'SIMKL_CLIENT_SECRET',
  );

  static const TMDB_API_KEY = String.fromEnvironment('TMDB_API_KEY');

  /// Optional URL of the separately deployed AniFox manga API.
  static const MANGA_API_URL = String.fromEnvironment('MANGA_API_URL');

  /// Optional licensed download provider. Expected to expose `GET /downloads`.
  static const DOWNLOAD_API_URL = String.fromEnvironment('DOWNLOAD_API_URL');

  /// Bearer token sent to the download provider.
  static const DOWNLOAD_API_KEY = String.fromEnvironment('DOWNLOAD_API_KEY');

  // helpers
  static List<String> get ANILIST_CLIENT_ID_LIST =>
      ANILIST_CLIENT_ID.split('|');

  static List<String> get ANILIST_CLIENT_SECRET_LIST =>
      ANILIST_CLIENT_SECRET.split('|');

  static List<String> get MAL_CLIENT_ID_LIST => MAL_CLIENT_ID.split('|');

  static List<String> get MAL_CLIENT_SECRET_LIST =>
      MAL_CLIENT_SECRET.split('|');

  static List<String> get SIMKL_CLIENT_ID_LIST => SIMKL_CLIENT_ID.split('|');

  static List<String> get SIMKL_CLIENT_SECRET_LIST =>
      SIMKL_CLIENT_SECRET.split('|');
}

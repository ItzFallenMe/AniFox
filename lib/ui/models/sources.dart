import 'package:anifox/core/anime/extensions/extension_manager.dart';
import 'package:anifox/core/anime/providers/allanime.dart';
import 'package:anifox/core/anime/providers/anikoto.dart';
import 'package:anifox/core/anime/providers/animegg.dart';
import 'package:anifox/core/anime/providers/animekai.dart';
import 'package:anifox/core/anime/providers/animeonsen.dart';
import 'package:anifox/core/anime/providers/animepahe.dart';
import 'package:anifox/core/anime/providers/animeparadise.dart';
import 'package:anifox/core/anime/providers/anizone.dart';
import 'package:anifox/core/anime/providers/gojo.dart';
import 'package:anifox/core/anime/providers/gogoanime.dart';
import 'package:anifox/core/anime/providers/megaplay.dart';
import 'package:anifox/core/anime/providers/anidb.dart';
import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/providerDetails.dart';
import 'package:anifox/core/anime/providers/providerManager.dart';
import 'package:anifox/core/anime/providers/providerPlugin.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:flutter/material.dart';

/// This Singleton manages all the sources/providers
/// Contains the list of sources and methods to interact with them
class SourceManager {
  SourceManager._();

  static final SourceManager instance = SourceManager._();

  static final _undownloadableSources = [
    //uses mpd which needs ffmpeg to download (makes the app bulky :< )
    "animeonsen", "anizone"
  ];

  /// v2: full inbuilt catalogue. Identifiers are `<lower>_inbuilt`.
  static const List<String> inbuiltSourceNames = [
    "AnimePahe",
    "AnimeKai",
    "Anikoto",
    "Gogoanime",
    "AllAnime",
    "AnimeParadise",
    "MegaPlay",
    "AnimeOnsen",
    "AniZone",
    "Animegg",
    "AniDB",
    "Gojo",
  ];

  final List<ProviderDetails> inbuiltSources = inbuiltSourceNames
      .map((e) => ProviderDetails(
          name: e,
          identifier: e.toLowerCase() + "_inbuilt",
          version: "0.0.0.0",
          supportDownloads: !_undownloadableSources.contains(e.toLowerCase())))
      .toList();

  /// Used till complete migration to remote providers is complete.
  bool _useInbuiltProviders = true;

  bool get useInbuiltProviders => _useInbuiltProviders;

  set useInbuiltProviders(bool val) => _useInbuiltProviders = val;

  final List<ProviderDetails> _sources = [];

  final ProviderPlugin _plugin = ProviderPlugin();

  final ExtensionManager extensionManager = ExtensionManager.instance;

  List<ProviderDetails> get sources => _sources;

  void addSource(ProviderDetails source) {
    _sources.add(source);
  }

  void addSources(List<ProviderDetails> sources) {
    _sources.addAll(sources);
  }

  void removeSource(String identifier) {
    _sources.removeWhere((e) => e.identifier == identifier);
  }

  Future<void> loadProviders({bool clearBeforeLoading = true}) async {
    final providers = await ProviderManager().getSavedProviders();
    if (clearBeforeLoading) _sources.clear();
    // v2: merge installed extensions (ShonenX-style) as plugin sources.
    try {
      final installed = await extensionManager.getInstalled();
      for (final ext in installed.where((e) => e.isEnabled)) {
        final shortId = ext.id.split(':').last;
        if (providers.any((p) => p.identifier == shortId)) continue;
        providers.add(ProviderDetails(
          name: '${ext.name} [Ext]',
          identifier: ext.id,
          version: ext.version ?? '1.0.0',
          icon: ext.iconUrl,
          supportDownloads: ext.supportsDownload,
        ));
      }
    } catch (_) {}
    // De-dupe by identifier.
    final seen = <String>{};
    final deduped = <ProviderDetails>[];
    for (final p in providers) {
      if (seen.add(p.identifier)) deduped.add(p);
    }
    _sources.addAll(deduped);
  }

  /// v2: search across all enabled sources, return per-source results.
  /// Failures per-source are swallowed so one dead mirror doesn't kill search.
  Future<Map<String, List<Map<String, String?>>>> searchAllSources(String query, {bool dub = false}) async {
    final out = <String, List<Map<String, String?>>>{};
    for (final src in List<ProviderDetails>.from(_sources)) {
      try {
        out[src.identifier] = await searchInSource(src.identifier, query);
      } catch (_) {
        out[src.identifier] = [];
      }
    }
    return out;
  }

  /// v2: provider health check (used by Extensions UI + diagnostics).
  Future<Map<String, bool>> checkProvidersHealth() async {
    final out = <String, bool>{};
    for (final src in List<ProviderDetails>.from(_sources)) {
      try {
        final res = await searchInSource(src.identifier, 'naruto');
        out[src.identifier] = res.isNotEmpty;
      } catch (_) {
        out[src.identifier] = false;
      }
    }
    return out;
  }

  Future<List<Map<String, String?>>> searchInSource(String source, String query) async {
    if (query.isEmpty) throw new Exception("ERR_EMPTY_QUERY");
    final searchResults = await (await _getProvider(source)).search(query);
    return searchResults;
  }

  Future<List<EpisodeDetails>> getAnimeEpisodes(String source, String link, {bool dub = false}) async {
    final info = await (await _getProvider(source)).getAnimeEpisodeLink(link, dub: dub);

    /// should be list of map corresponding to values of [EpisodeList]
    return info.map((e) => EpisodeDetails.fromMap(e)).toList();
  }

  Future<void> getDownloadSources(String source, String episodeUrl, Function(List<VideoStream>, bool) updateFunction,
      {bool dub = false, String? metadata}) async {
    await (await _getProvider(source)).getDownloadSources(episodeUrl, updateFunction, dub: dub, metadata: metadata);
  }

  Future<void> getStreams(String source, String episodeId, void Function(List<VideoStream>, bool) updateFunction,
      {bool dub = false, String? metadata}) async {
    await (await _getProvider(source)).getStreams(episodeId, updateFunction, dub: dub, metadata: metadata);
  }

  Future<AnimeProvider> _getProvider(String identifier) async {
    // v2: always try inbuilt first, then plugin/extensions (ShonenX-style
    // unified resolution). Legacy `_useInbuiltProviders` flag is kept for
    // compat but no longer gates extension resolution.
    try {
      return getClass(identifier);
    } catch (_) {}
    // Extension ids may be "repo:shortId" — also try short form.
    final AnimeProvider? provider = await _plugin.getProvider(identifier);
    if (provider == null) throw Exception("$identifier Provider doesnt exist!");
    return provider;
  }
}

final Map<String, AnimeProvider> sources = {
  "animepahe": AnimePahe(),
  "animekai": AnimeKai(),
  "anikoto": Anikoto(),
  "gogoanime": Gogoanime(),
  "allanime": AllAnime(),
  "animeparadise": AnimeParadise(),
  "megaplay": MegaPlay(),
  "animeonsen": AnimeOnsen(),
  "gojo": Gojo(),
  "anizone": AniZone(),
  "animegg": Animegg(),
  "anidb": AniDB(),
};

AnimeProvider getClass(String source) {
  final match = sources[source.replaceAll("_inbuilt", "")]; // for ignoring _inbuilt suffix
  if (match == null) {
    throw Exception("Invalid Source!");
  }

  return match;
}

List<DropdownMenuEntry> getSourceDropdownList() {
  List<DropdownMenuEntry> widget = [];
  final sources = SourceManager.instance.sources;
  int count = 0;
  for (final source in sources) {
    widget.add(
      DropdownMenuEntry(
        value: source,
        label: "${source.name}${source.version == "0.0.0.0" ? "" : " [Plugin]"}",
        trailingIcon:
            source.identifier == currentUserSettings?.preferredProvider ? Icon(Icons.star_border_rounded) : null,
        style: ButtonStyle(
          foregroundColor: WidgetStatePropertyAll(appTheme.textMainColor),
          textStyle: WidgetStatePropertyAll(
            TextStyle(
              color: appTheme.textMainColor,
              fontFamily: "Rubik",
              fontSize: 18,
            ),
          ),
        ),
      ),
    );
    count = count++;
  }
  return widget;
}

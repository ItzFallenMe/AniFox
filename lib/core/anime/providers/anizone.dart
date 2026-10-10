import 'dart:convert';

import 'package:anifox/core/anime/providers/animeProvider.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:html/parser.dart';
import 'package:anifox/core/network/network.dart';

class AniZone extends AnimeProvider {
  final baseUrl = "https://anizone.to";

  @override
  Future<List<Map<String, String?>>> search(String query) async {
    final q = Uri.encodeQueryComponent(query.trim());
    final url = "$baseUrl/anime?search=$q";
    final res = await get(
      Uri.parse(url),
      cacheDuration: const Duration(minutes: 5),
    );
    res.ensureSuccess('anizone search');

    final doc = parse(res.body);
    final grid = doc.querySelector("div.grid.grid-cols-1.gap-4");
    if (grid == null) {
      throw Exception("Got list of children as null.");
    }
    final children = grid.children;

    final List<Map<String, String?>> searchRes = [];

    for (final child in children) {
      final divData = child.attributes['x-data'];

      final matchRegEx = RegExp(r"JSON\.parse\('(.+?)'\)", dotAll: true);

      final match = matchRegEx.firstMatch(divData ?? "");

      if (match == null) {
        throw Exception("Couldn't find anime data");
      }

      final title = jsonDecode(match.group(1)!.replaceAll(r'\u0022', '"'))['1'];

      final a = child.querySelector("a");
      if (a == null) {
        throw Exception("Found null item.");
      }

      final href = a.attributes['href'];

      final img = child.querySelector("img")?.attributes['src'];
      if (img == null || href == null || title == null) {
        throw Exception("Found null image/title/url.");
      }

      searchRes.add({
        'name': title,
        'alias': href,
        'imageUrl': img,
      });
    }

    return searchRes;
  }

  @override
  Future<List<Map<String, dynamic>>> getAnimeEpisodeLink(String aliasId,
      {bool dub = false}) async {
    final url = aliasId;
    final res = await get(
      Uri.parse(url),
      cacheDuration: const Duration(minutes: 5),
    );
    res.ensureSuccess('anizone episodes');
    final doc = parse(res.body);

    final list = doc.querySelector("ul.grid.grid-cols-1")?.children;

    final epList = <Map<String, dynamic>>[];

    if (list == null) return [];

    int i = 1;

    for (final item in list) {
      final divData = item.attributes['x-data'];

      final matchRegEx = RegExp(r"JSON\.parse\('(.+?)'\)", dotAll: true);

      final match = matchRegEx.firstMatch(divData ?? "");

      if (match == null) {
        throw Exception("Couldn't find anime data");
      }

      final title = jsonDecode(match.group(1)!.replaceAll(r'\u0022', '"'))['1'];

      final epLink = item.querySelector("a")?.attributes['href'];
      final epImg = item.querySelector("img")?.attributes['src'];
      // final title = item.querySelector("h3")?.text;
      epList.add({
        'episodeLink': epLink,
        'episodeNumber': i,
        'thumbnail': epImg,
        'episodeTitle': title,
        'isFiller': false,
        'hasDub': false,
      });

      i++;
    }

    return epList;
  }

  @override
  Future<void> getDownloadSources(
      String episodeUrl, Function(List<VideoStream> p1, bool p2) update,
      {bool dub = false, String? metadata}) {
    throw UnimplementedError();
  }

  @override
  Future<void> getStreams(
      String episodeId, Function(List<VideoStream> p1, bool p2) update,
      {bool dub = false, String? metadata}) async {
    final url = episodeId;
    final res = await get(
      Uri.parse(url),
      cacheDuration: const Duration(hours: 1),
    );
    res.ensureSuccess('anizone episode');
    final doc = parse(res.body);

    final mediaPlayer = doc.querySelector("media-player");
    if (mediaPlayer == null) {
      throw Exception("Couldnt find media player");
    }

    final src = mediaPlayer.attributes['src'];

    if (src == null || src.isEmpty) {
      throw Exception("Failed to resolve the source link");
    }

    final tracks = mediaPlayer.querySelectorAll("track");

    // Subtitle tracks are optional — never index into an empty list
    // (this used to throw StateError and kill the whole stream load).
    String? subUrl;
    String? subType;
    for (final track in tracks) {
      if (track.attributes['srclang'] == "en" &&
          track.attributes['kind'] == "subtitles") {
        final isDefault = track.attributes.containsKey("default");
        if (subUrl == null || isDefault) {
          subUrl = track.attributes['src'];
          subType = track.attributes['data-type'] ?? 'vtt';
        }
        if (isDefault) break;
      }
    }

    final srcName = doc
            .querySelector(
                ".flex.gap-2.relative.items-center.p-3.rounded-lg.text-white.bg-teal-600")
            ?.text
            .trim()
            .isNotEmpty ==
        true
        ? doc
            .querySelector(
                ".flex.gap-2.relative.items-center.p-3.rounded-lg.text-white.bg-teal-600")!
            .text
            .trim()
        : "single";

    update([
      VideoStream(
          quality: "multi-quality",
          url: src,
          server: srcName,
          subtitle: subUrl,
          subtitleFormat: subUrl != null ? subType : null,
          backup: false)
    ], true);
  }

  @override
  String get providerName => "anizone";
}

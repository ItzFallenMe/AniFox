import 'package:anifox/core/anime/extractors/type.dart';
import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/app/values.dart';
import 'package:anifox/core/network/network.dart';
import 'package:html/parser.dart' as html;

/// Kwik (AnimePahe's file host) extractor.
///
/// Notes from the live site (verified Oct 2026):
/// - Embed domain is `kwik.cx`, but it Cloudflare-blocks requests that
///   don't come through the AnimePahe watch page. The Referer must be the
///   origin of the kwik URL itself (or the animepahe page), with a real
///   browser UA — a hardcoded dead-domain referer gets a block page.
/// - The player JS is PACKER-packed (`eval(function(p,a,c,k,e,d...)`) and
///   the stream shows up as `source=<url>` (sometimes `const source =
///   '...m3u8'`). Both shapes are handled.
class Kwik extends AnimeExtractor {
  Future<List<VideoStream>> extract(String streamUrl,
      {String? quality, String? server}) async {
    final uri = Uri.parse(streamUrl);
    // Mimic navigation from the embed origin — this is what un-blocks kwik.
    final originReferer = uri.hasScheme && uri.host.isNotEmpty
        ? '${uri.scheme}://${uri.host}/'
        : 'https://kwik.cx/';
    final res = await get(
      uri,
      headers: {
        'referer': originReferer,
        'User-Agent': AppValues.defaultClientUserAgent,
        'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cacheDuration: const Duration(hours: 1),
    );
    res.ensureSuccess('kwik embed');
    if (res.looksLikeChallenge) {
      throw Exception(
          'Kwik served a Cloudflare challenge for $streamUrl. Retry later or switch server.');
    }

    final doc = html.parse(res.body);
    String? streamLink;
    for (final element in doc.querySelectorAll("script")) {
      final scriptHtml = element.innerHtml;
      if (!scriptHtml.contains('eval(function(p,a,c,k,e,d)')) continue;
      String unpacked;
      try {
        unpacked = JsUnpack(scriptHtml).unpack();
      } catch (e) {
        Logs.app.log('Kwik unpack failed, trying raw script: $e');
        unpacked = scriptHtml;
      }
      // Shape 1 (current): source=https://...m3u8 (may be split as
      // `https.split("://")` obfuscation — rejoin it).
      // Shape 2 (older): const source = '...m3u8'.
      streamLink = RegExp(r"source\s*=\s*(https?://[^;'\s]+)")
              .firstMatch(unpacked)
              ?.group(1) ??
          RegExp(r"const\s+source\s*=\s*'([^']+\.m3u8[^']*)'")
              .firstMatch(unpacked)
              ?.group(1);
      if (streamLink != null) {
        final cleaned = streamLink
            .replaceAll(RegExp(r'\s+'), '')
            .replaceAll('.split("://")', '://')
            .replaceAll(".split('://')", '://');
        if (cleaned.startsWith('http')) {
          streamLink = cleaned;
          break;
        }
        streamLink = null;
      }
    }

    final link = streamLink;
    if (link == null || link.isEmpty) {
      throw Exception("UNABLE TO EXTRACT KWIK STREAM from $streamUrl");
    }

    return [
      VideoStream(
          quality: quality ?? "single",
          url: link,
          server: server ?? "Kwik",
          backup: false,
          customHeaders: {'referer': originReferer})
    ];
  }
}

class JsUnpack {
  final String source;
  const JsUnpack(this.source);
  static const alphabet =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  ///Unpacks P.A.C.K.E.R. packed js code
  String unpack() {
    final lst = _filterargs();
    final String payload =
        lst[0].replaceAll("\\\\", "\\").replaceAll("\\'", "'");
    final List<String> symtab = lst[1];
    String source = payload;
    final reg = RegExp(
      r"\b\w+\b",
    ).allMatches(payload);
    int correct = 0;
    for (RegExpMatch element in reg) {
      final word = payload.substring(element.start, element.end);
      String lookUp = "";
      final v = toBase10(word);
      if (v < symtab.length) {
        try {
          lookUp = symtab[v];
        } catch (_) {}
        if (lookUp.isEmpty) lookUp = word;
      } else {
        lookUp = word;
      }
      source = source.replaceRange(element.start + correct,
          element.start + word.length + correct, lookUp);
      correct += lookUp.length - (element.end - element.start);
    }
    return _replaceStrings(source);
  }

  String _replaceStrings(String source) {
    var re =
        RegExp(r'var *(_\w+)=\["(.*?)"];', dotAll: true).firstMatch(source);
    if (re == null) {
      return source;
    }
    final strings = re.group(1)!;
    return source.substring(strings.length);
  }

  List<dynamic> _filterargs() {
    final all =
        RegExp(r"}\s*\('(.*)',\s*(.*?),\s*(\d+),\s*'(.*?)'\.split\('\|'\)")
            .firstMatch(source);
    if (all == null) {
      throw 'Corrupted p.a.c.k.e.r. data.';
    }
    return [
      all.group(1),
      all.group(4)!.split("|"),
      int.tryParse(all.group(2)!) ?? 36,
      int.parse(all.group(3)!)
    ];
  }

  int toBase10(String string) {
    return string.split('').fold(0, (int out, char) {
      int charIndex = alphabet.indexOf(char);
      return out * alphabet.length + charIndex;
    });
  }
}

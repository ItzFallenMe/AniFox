import 'dart:convert';

import 'package:anifox/common/models/unified_media.dart';
import 'package:anifox/streaming/models/stream_source.dart';
import 'package:anifox/streaming/sources/manga_api_source.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  group('MangaApiSource', () {
    test('maps search results into AniFox manga media', () async {
      final client = MockClient((request) async {
        expect(request.url.pathSegments, ['api', 'search', 'One Piece']);
        expect(request.url.queryParameters['page'], '2');
        return _jsonResponse({
          'mangaList': [
            {
              'id': 'one-piece',
              'title': 'One Piece',
              'image': '//cdn.example/cover.jpg',
              'description': 'A pirate adventure',
            },
          ],
        });
      });
      final source = _source(client);

      final results = await source.search(
        'One Piece',
        MediaType.MANGA,
        page: 2,
      );

      expect(results, hasLength(1));
      expect(results.single.id, 'one-piece');
      expect(results.single.providerId, 'one-piece');
      expect(results.single.type, MediaType.MANGA);
      expect(results.single.title.getPreferedTitle, 'One Piece');
      expect(results.single.cover, 'https://cdn.example/cover.jpg');
    });

    test('maps chapter ids and page image URLs', () async {
      final client = MockClient((request) async {
        if (request.url.path == '/api/manga/one-piece') {
          return _jsonResponse({
            'name': 'One Piece',
            'chapterList': [
              {'id': 'chapter-2', 'name': 'Chapter 2', 'createdAt': 'Today'},
              {'id': 'chapter-1', 'name': 'Chapter 1'},
            ],
          });
        }
        if (request.url.path == '/api/manga/one-piece/chapter-2') {
          return _jsonResponse({
            'images': [
              {'image': '//cdn.example/page-1.jpg'},
              {'image': 'https://cdn.example/page-2.jpg'},
            ],
          });
        }
        return http.Response('not found', 404);
      });
      final source = _source(client);

      final chapters = await source.getChapters('one-piece');
      final pages = await source.getPages(chapters.first.id);

      expect(chapters.map((chapter) => chapter.number), [2, 1]);
      expect(chapters.first.id, 'one-piece::chapter-2');
      expect(chapters.first.uploadDate, 'Today');
      expect(pages.map((page) => page.url), [
        'https://cdn.example/page-1.jpg',
        'https://cdn.example/page-2.jpg',
      ]);
    });

    test('reports invalid chapter identifiers without making a request', () {
      final source = _source(MockClient((_) async => http.Response('', 500)));

      expect(
        () => source.getPages('chapter-without-manga-id'),
        throwsA(isA<MangaApiException>()),
      );
    });
  });
}

MangaApiSource _source(http.Client client) => MangaApiSource(
  const StreamSource(
    id: MangaApiSource.sourceId,
    name: MangaApiSource.sourceName,
    kind: StreamSourceKind.builtin,
    mediaType: MediaType.MANGA,
    baseUrl: 'https://manga.example',
  ),
  client: client,
);

http.Response _jsonResponse(Map<String, Object?> data) => http.Response(
  jsonEncode(data),
  200,
  headers: const {'content-type': 'application/json'},
);

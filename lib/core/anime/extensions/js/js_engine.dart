import 'dart:async';
import 'dart:convert';

import 'package:anifox/core/app/logging.dart';
import 'package:anifox/core/network/network.dart';
import 'package:flutter_qjs/flutter_qjs.dart';
import 'package:hive/hive.dart';
import 'package:html/dom.dart';
import 'package:html/parser.dart' as html_parser;
import 'package:js_unpack/js_unpack.dart';

/// QuickJS runtime for Mangayomi-style JS extensions.
///
/// Mirrors the execution contract of ShonenX's AnymeX bridge
/// (`JsExtensionEngine` + `JsHttpClient` + `JsDomSelector` + `JsUtils`):
/// extensions run `class DefaultExtension extends MProvider` with async
/// `search` / `getDetail` / `getVideoList` methods, and reach the outside
/// world only through the synchronous `sendMessage(channel, jsonArgs)`
/// bridge implemented below.
///
/// Channels (Dart side):
/// - `http_get`, `http_post`, `http_put`, `http_delete`, `http_patch`,
///   `http_head` → AniFox network client, returns
///   `{body, headers, statusCode}` JSON.
/// - `dom_*` → element-handle table over the `html` package.
/// - `prefs_get`, `prefs_set` → per-extension Hive preferences.
/// - `unpack_js` → PACKER unpack via the `js_unpack` package.
/// - `log` → app log.
///
/// JS prelude (evaluated once per runtime): `Client`, `Document`, `Element`,
/// `SharedPreferences`, `MProvider`, string helpers.
///
/// Isolation: each extension gets its OWN runtime ([forExtension]), because
/// extension files define globals (`DefaultExtension`, helper extractors)
/// that would otherwise clobber each other. Idle runtimes are evicted
/// LRU-style ([maxRuntimes]).
class ExtensionJsEngine {
  ExtensionJsEngine._(this.prefsScope);

  /// Scope for `prefs_*` channels (one per extension id).
  final String prefsScope;

  static final Map<String, ExtensionJsEngine> _pool = {};
  static const int maxRuntimes = 4;
  static final List<String> _lru = [];

  /// Get (or create) the isolated runtime for an extension id.
  static ExtensionJsEngine forExtension(String extensionId) {
    final existing = _pool[extensionId];
    if (existing != null) {
      _lru.remove(extensionId);
      _lru.add(extensionId);
      return existing;
    }
    while (_pool.length >= maxRuntimes && _lru.isNotEmpty) {
      final evict = _lru.removeAt(0);
      _pool.remove(evict);
    }
    final engine = ExtensionJsEngine._(extensionId);
    _pool[extensionId] = engine;
    _lru.add(extensionId);
    return engine;
  }

  /// Shared/global runtime (used for one-off evaluations only).
  static ExtensionJsEngine get instance => forExtension('__global__');

  JavascriptRuntime? _rt;
  Completer<void>? _initCompleter;
  final Map<int, Element?> _elements = {};
  int _elementKey = 0;

  /// Shared boot future. Every caller — first or concurrent — awaits the
  /// SAME future object, so a boot failure is always delivered to a
  /// listener and can never escape as an unhandled async error.
  Future<void> init() {
    final existing = _initCompleter;
    if (existing != null) return existing.future;
    final c = _initCompleter = Completer<void>();
    _doInit().then((_) {
      if (!c.isCompleted) c.complete();
    }).catchError((Object e, StackTrace st) {
      // Allow a later retry: drop the failed completer only after handing
      // the error to everyone already holding its future.
      _initCompleter = null;
      _rt = null;
      if (!c.isCompleted) c.completeError(e, st);
    });
    return c.future;
  }

  Future<void> _doInit() async {
    _rt = getJavascriptRuntime();
    _registerHttp();
    _registerDom();
    _registerPrefs();
    _registerUtils();
    _rt!.evaluate(_prelude);
    // shims used by many extensions
    _rt!.evaluate('''
      var fjs = { bridge_call: function(data) { return sendMessage('bridge', data); } };
      if (typeof console === 'undefined') { var console = { log: function(){}, warn: function(){}, error: function(){} }; }
    ''');
  }

  JavascriptRuntime get _runtime {
    final rt = _rt;
    if (rt == null) throw StateError('ExtensionJsEngine not initialized');
    return rt;
  }

  // ---------------------------------------------------------------- HTTP

  void _registerHttp() {
    Future<String> doRequest(String method, dynamic args) async {
      final a = args as List;
      final url = a[2] as String;
      final headers = ((a.length > 3 ? a[3] : null) as Map?)
          ?.map((k, v) => MapEntry(k.toString(), v.toString()));
      final rawBody = a.length > 4 ? a[4] : null;
      try {
        final uri = Uri.parse(url);
        late final dynamic resp;
        switch (method) {
          case 'POST':
            resp = await post(uri, headers: headers, body: rawBody);
            break;
          case 'PUT':
            resp = await put(uri, headers: headers, body: rawBody);
            break;
          case 'PATCH':
            resp = await patch(uri, headers: headers, body: rawBody);
            break;
          case 'DELETE':
            resp = await delete(uri, headers: headers);
            break;
          case 'HEAD':
            resp = await head(uri, headers: headers);
            break;
          default:
            resp = await get(uri, headers: headers);
        }
        return jsonEncode({
          'body': resp.body,
          'headers': resp.headers,
          'statusCode': resp.statusCode,
        });
      } catch (e) {
        Logs.app.log('JS http $method failed: $e');
        return jsonEncode({'body': '', 'headers': {}, 'statusCode': 0});
      }
    }

    _rt!.onMessage('http_get', (args) => doRequest('GET', args));
    _rt!.onMessage('http_post', (args) => doRequest('POST', args));
    _rt!.onMessage('http_put', (args) => doRequest('PUT', args));
    _rt!.onMessage('http_delete', (args) => doRequest('DELETE', args));
    _rt!.onMessage('http_patch', (args) => doRequest('PATCH', args));
    _rt!.onMessage('http_head', (args) => doRequest('HEAD', args));
  }

  // ---------------------------------------------------------------- DOM

  int _store(Element? el) {
    _elementKey++;
    _elements[_elementKey] = el;
    return _elementKey;
  }

  void _registerDom() {
    Map<String, String> str(Element? el) => {
          'text': el?.text ?? '',
          'innerHtml': el?.innerHtml ?? '',
          'outerHtml': el?.outerHtml ?? '',
          'className': el?.className ?? '',
          'localName': el?.localName ?? '',
        };

    _rt!.onMessage('get_doc_element', (args) {
      final doc = html_parser.parse(args[0] as String);
      final el = switch (args[1]) {
        'body' => doc.body,
        'head' => doc.head,
        'documentElement' => doc.documentElement,
        _ => doc.parent,
      };
      return _store(el);
    });
    _rt!.onMessage('get_doc_string', (args) {
      final doc = html_parser.parse(args[0] as String);
      return args[1] == 'text' ? doc.text : doc.outerHtml;
    });
    _rt!.onMessage('get_element_string', (args) {
      final el = _elements[args[1]];
      if (el == null) return '';
      final m = str(el);
      return m[args[0]] ?? '';
    });
    _rt!.onMessage('ele_attr', (args) => _elements[args[1]]?.attributes[args[0]] ?? '');
    _rt!.onMessage('doc_attr', (args) {
      try {
        return html_parser.parse(args[0] as String).querySelector('*')?.attributes[args[1]] ?? '';
      } catch (_) {
        return '';
      }
    });
    _rt!.onMessage('ele_has_attr', (args) => _elements[args[1]]?.attributes.containsKey(args[0]) ?? false);
    _rt!.onMessage('doc_select_first', (args) {
      return _store(html_parser.parse(args[0] as String).querySelector(args[1] as String));
    });
    _rt!.onMessage('doc_select', (args) {
      final keys = <int>[];
      for (final el in html_parser.parse(args[0] as String).querySelectorAll(args[1] as String)) {
        keys.add(_store(el));
      }
      return jsonEncode(keys);
    });
    _rt!.onMessage('ele_select_first', (args) {
      return _store(_elements[args[1]]?.querySelector(args[0] as String));
    });
    _rt!.onMessage('ele_select', (args) {
      final keys = <int>[];
      for (final el in _elements[args[1]]?.querySelectorAll(args[0] as String) ?? <Element>[]) {
        keys.add(_store(el));
      }
      return jsonEncode(keys);
    });
    _rt!.onMessage('ele_element_sibling', (args) {
      final el = _elements[args[1]];
      return _store(args[0] == 'nextElementSibling' ? el?.nextElementSibling : el?.previousElementSibling);
    });
    _rt!.onMessage('doc_get_elements_by', (args) {
      final doc = html_parser.parse(args[0] as String);
      final List<Element> els;
      switch (args[1]) {
        case 'children':
          els = doc.children;
          break;
        case 'getElementsByTagName':
          els = doc.getElementsByTagName(args[2] as String);
          break;
        default:
          els = doc.getElementsByClassName(args[2] as String);
      }
      return jsonEncode(els.map(_store).toList());
    });
    _rt!.onMessage('ele_get_elements_by', (args) {
      final el = _elements[args[2]];
      final List<Element> els;
      switch (args[0]) {
        case 'children':
          els = el?.children ?? [];
          break;
        case 'getElementsByTagName':
          els = el?.getElementsByTagName(args[1] as String) ?? [];
          break;
        default:
          els = el?.getElementsByClassName(args[1] as String) ?? [];
      }
      return jsonEncode(els.map(_store).toList());
    });
    _rt!.onMessage('doc_get_element_by_id', (args) {
      return _store(html_parser.parse(args[0] as String).getElementById(args[1] as String));
    });
  }

  // ---------------------------------------------------------------- prefs

  Future<Box> _prefsBox() => Hive.openBox('ext_prefs');

  void _registerPrefs() {
    _rt!.onMessage('prefs_get', (args) async {
      try {
        final box = await _prefsBox();
        final v = box.get('$prefsScope/${args[0]}');
        await box.close();
        return v;
      } catch (_) {
        return null;
      }
    });
    _rt!.onMessage('prefs_set', (args) async {
      try {
        final box = await _prefsBox();
        await box.put('$prefsScope/${args[0]}', args.length > 1 ? args[1] : null);
        await box.close();
      } catch (_) {}
      return null;
    });
  }

  // ---------------------------------------------------------------- utils

  void _registerUtils() {
    _rt!.onMessage('log', (args) {
      Logs.app.log('[JS] $args');
      return null;
    });
    _rt!.onMessage('unpack_js', (args) {
      try {
        return JsUnpack(args[0].toString()).unpack();
      } catch (_) {
        return args[0].toString();
      }
    });
  }

  // ---------------------------------------------------------------- eval

  /// Evaluate [code] (must already be loaded) and return the raw result.
  Future<JsEvalResult> eval(String code) async {
    await init();
    return _runtime.evaluate(code);
  }

  /// Evaluate async JS and return its JSON-serialized completion value.
  Future<dynamic> evalJson(String code) async {
    await init();
    final res = await _runtime.evaluateAsync(
        '(async () => JSON.stringify(await (async () => { $code })()))()');
    if (res.isError) throw Exception('JS error: ${res.stringResult}');
    final s = res.stringResult;
    if (s.isEmpty || s == 'undefined') return null;
    return jsonDecode(s);
  }

  /// Load an extension module: evaluates source, then instantiates
  /// `DefaultExtension` (class API) — plain-function sources are kept as-is
  /// and detected by the service layer.
  Future<void> loadModule(String moduleName, String sourceCode) async {
    await init();
    final safeName = moduleName.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    _runtime.evaluate('''
try { if (typeof extension !== 'undefined') { extension = undefined; } } catch (e) {}
$sourceCode
globalThis['$safeName'] = (typeof DefaultExtension !== 'undefined')
    ? new DefaultExtension()
    : null;
globalThis['${safeName}_hasClass'] = (typeof DefaultExtension !== 'undefined');
''');
  }

  Future<bool> moduleHasClass(String moduleName) async {
    final safeName = moduleName.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    final res = await eval("globalThis['${safeName}_hasClass'] === true ? '1' : '0'");
    return res.stringResult == '1';
  }

  /// Call `extension.<method>(...jsonArgs)` on a loaded class-API module and
  /// decode the JSON result.
  Future<dynamic> callModuleMethod(
      String moduleName, String method, List<dynamic> positionalArgs) async {
    final safeName = moduleName.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    final argsJson = jsonEncode(positionalArgs);
    return evalJson('''
const __m = globalThis['$safeName'];
if (__m == null) throw new Error('extension module not loaded');
const __fn = __m['$method'];
if (typeof __fn !== 'function') throw new Error('method $method not implemented');
return await __fn.apply(__m, $argsJson);
''');
  }

  /// Call a top-level plain function `fn(...jsonArgs)` (simple-function API).
  Future<dynamic> callFunction(String fn, List<dynamic> positionalArgs) async {
    final argsJson = jsonEncode(positionalArgs);
    return evalJson('''
if (typeof $fn !== 'function') throw new Error('function $fn not implemented');
return await $fn.apply(null, $argsJson);
''');
  }

  // ---------------------------------------------------------------- prelude

  static const String _prelude = r'''
class Client {
    constructor(reqOptions) { this.reqOptions = reqOptions; }
    async _call(channel, parts) {
        const result = await sendMessage(channel, JSON.stringify(parts));
        return JSON.parse(result);
    }
    async head(url, headers) { return this._call("http_head", [null, this.reqOptions, url, headers || {}]); }
    async get(url, headers) { return this._call("http_get", [null, this.reqOptions, url, headers || {}]); }
    async post(url, headers, body) { return this._call("http_post", [null, this.reqOptions, url, headers || {}, body]); }
    async put(url, headers, body) { return this._call("http_put", [null, this.reqOptions, url, headers || {}, body]); }
    async delete(url, headers, body) { return this._call("http_delete", [null, this.reqOptions, url, headers || {}, body]); }
    async patch(url, headers, body) { return this._call("http_patch", [null, this.reqOptions, url, headers || {}, body]); }
}
class Element {
    constructor(key) { this._key = key; }
    get text() { return sendMessage("get_element_string", JSON.stringify(["text", this._key])); }
    get innerHtml() { return sendMessage("get_element_string", JSON.stringify(["innerHtml", this._key])); }
    get outerHtml() { return sendMessage("get_element_string", JSON.stringify(["outerHtml", this._key])); }
    get className() { return sendMessage("get_element_string", JSON.stringify(["className", this._key])); }
    get localName() { return sendMessage("get_element_string", JSON.stringify(["localName", this._key])); }
    attr(name) { return sendMessage("ele_attr", JSON.stringify([name, this._key])); }
    hasAttr(name) { return sendMessage("ele_has_attr", JSON.stringify([name, this._key])); }
    selectFirst(s) { return new Element(sendMessage("ele_select_first", JSON.stringify([s, this._key]))); }
    select(s) {
        const keys = JSON.parse(sendMessage("ele_select", JSON.stringify([s, this._key])));
        return keys.map((k) => new Element(k));
    }
    get nextElementSibling() { return new Element(sendMessage("ele_element_sibling", JSON.stringify(["nextElementSibling", this._key]))); }
    get previousElementSibling() { return new Element(sendMessage("ele_element_sibling", JSON.stringify(["previousElementSibling", this._key]))); }
    getElementsListBy(t, n) {
        const keys = JSON.parse(sendMessage("ele_get_elements_by", JSON.stringify([t, n || "", this._key])));
        return keys.map((k) => new Element(k));
    }
    get children() { return this.getElementsListBy("children", ""); }
    getElementsByTagName(n) { return this.getElementsListBy("getElementsByTagName", n); }
    getElementsByClassName(n) { return this.getElementsListBy("getElementsByClassName", n); }
    getSrc() { return sendMessage("get_element_string", JSON.stringify(["getSrc", this._key])); }
    getHref() { return sendMessage("get_element_string", JSON.stringify(["getHref", this._key])); }
}
class Document {
    constructor(html) { this.html = html; }
    get body() { return new Element(sendMessage("get_doc_element", JSON.stringify([this.html, "body"]))); }
    get head() { return new Element(sendMessage("get_doc_element", JSON.stringify([this.html, "head"]))); }
    get text() { return sendMessage("get_doc_string", JSON.stringify([this.html, "text"])); }
    get outerHtml() { return sendMessage("get_doc_string", JSON.stringify([this.html, "outerHtml"])); }
    selectFirst(s) { return new Element(sendMessage("doc_select_first", JSON.stringify([this.html, s]))); }
    select(s) {
        const keys = JSON.parse(sendMessage("doc_select", JSON.stringify([this.html, s])));
        return keys.map((k) => new Element(k));
    }
    getElementById(id) { return new Element(sendMessage("doc_get_element_by_id", JSON.stringify([this.html, id]))); }
    getElementsListBy(t, n) {
        const keys = JSON.parse(sendMessage("doc_get_elements_by", JSON.stringify([this.html, t, n || ""])));
        return keys.map((k) => new Element(k));
    }
}
class SharedPreferences {
    get(key) { return sendMessage("prefs_get", JSON.stringify([key])); }
    set(key, v) { return sendMessage("prefs_set", JSON.stringify([key, v])); }
}
if (!String.prototype.substringAfter) {
    String.prototype.substringAfter = function(s) { const i = this.indexOf(s); return i === -1 ? "" : this.substring(i + s.length); };
}
if (!String.prototype.substringBefore) {
    String.prototype.substringBefore = function(s) { const i = this.indexOf(s); return i === -1 ? this.toString() : this.substring(0, i); }
}
if (!String.prototype.substringAfterLast) {
    String.prototype.substringAfterLast = function(s) { const i = this.lastIndexOf(s); return i === -1 ? "" : this.substring(i + s.length); };
}
if (!String.prototype.substringBeforeLast) {
    String.prototype.substringBeforeLast = function(s) { const i = this.lastIndexOf(s); return i === -1 ? this.toString() : this.substring(0, i); }
}
class MProvider {
    get source() { throw new Error("source not implemented"); }
    async getPopular(page) { throw new Error("getPopular not implemented"); }
    async getLatestUpdates(page) { throw new Error("getLatestUpdates not implemented"); }
    async search(query, page, filters) { throw new Error("search not implemented"); }
    async getDetail(url) { throw new Error("getDetail not implemented"); }
    async getVideoList(url) { throw new Error("getVideoList not implemented"); }
    getFilterList() { throw new Error("getFilterList not implemented"); }
    getSourcePreferences() { throw new Error("getSourcePreferences not implemented"); }
}
async function jsonStringify(fn) { return JSON.stringify(await fn()); }
''';
}

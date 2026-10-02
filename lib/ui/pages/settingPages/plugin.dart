import 'package:anifox/core/anime/extensions/extension_manager.dart';
import 'package:anifox/core/anime/extensions/extension_models.dart';
import 'package:anifox/core/anime/providers/providerDetails.dart';
import 'package:anifox/core/anime/providers/providerManager.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/ui/models/snackBar.dart';
import 'package:anifox/ui/models/sources.dart';
import 'package:anifox/ui/models/widgets/loader.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// AniFox v2 Extensions page (ShonenX-style).
///
/// - **Installed**: inbuilt + installed extensions, enable/disable, uninstall.
/// - **Available**: fetched from all enabled repos, install in one tap.
/// - **Repos**: Manage Repos — add/remove/enable repo URLs (Mangayomi,
///   provins, AniFox formats), refresh.
class PluginPage extends StatefulWidget {
  const PluginPage({super.key});

  @override
  State<PluginPage> createState() => _PluginPageState();
}

class _PluginPageState extends State<PluginPage> with TickerProviderStateMixin {
  late TabController _tabController;
  final _providerManager = ProviderManager();
  final _extManager = ExtensionManager.instance;

  List<ProviderDetails>? _installedProviders;
  List<ExtensionSource>? _availableExtensions;
  List<ExtensionRepo>? _repos;
  bool _loadingAvailable = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    getProviders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> getProviders() async {
    final inbuilt = SourceManager.instance.inbuiltSources;
    final saved = await _providerManager.getSavedProviders();
    final installedExt = await _extManager.getInstalled();
    final installedExtAsDetails = installedExt
        .map((e) => ProviderDetails(
              name: '${e.name} [Ext]',
              identifier: e.id,
              version: e.version ?? '1.0.0',
              icon: e.iconUrl,
              supportDownloads: e.supportsDownload,
            ))
        .toList();
    if (!mounted) return;
    setState(() {
      _installedProviders = [...inbuilt, ...saved, ...installedExtAsDetails];
    });
    refreshRepos();
    refreshAvailable();
  }

  Future<void> refreshRepos() async {
    final repos = await _extManager.getRepos();
    if (!mounted) return;
    setState(() => _repos = repos);
  }

  Future<void> refreshAvailable() async {
    if (_loadingAvailable) return;
    setState(() {
      _loadingAvailable = true;
      _error = null;
    });
    try {
      final available = await _extManager.fetchAvailable();
      if (!mounted) return;
      setState(() => _availableExtensions = available);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loadingAvailable = false);
    }
  }

  Future<void> _installExtension(ExtensionSource ext) async {
    try {
      floatingSnackBar('Installing ${ext.name}...');
      final code = await _extManager.fetchExtensionCode(ext);
      if (code == null) {
        floatingSnackBar('Could not fetch source for ${ext.name}');
        return;
      }
      await _extManager.install(ext, code: code);
      await SourceManager.instance.loadProviders(clearBeforeLoading: false);
      await getProviders();
      floatingSnackBar('${ext.name} installed');
    } catch (err) {
      floatingSnackBar('Install failed: $err');
      if (currentUserSettings?.showErrors ?? false) {
        floatingSnackBar(err.toString(), waitForPreviousToFinish: true);
      }
    }
  }

  Future<void> _uninstallExtension(String identifier) async {
    // Extension ids contain ':'; legacy providers don't.
    if (identifier.contains(':')) {
      await _extManager.uninstall(identifier);
      SourceManager.instance.removeSource(identifier);
    } else if (!identifier.endsWith('_inbuilt')) {
      await _providerManager.removeProvider(ProviderDetails(
        name: identifier,
        identifier: identifier,
        version: '0.0.0',
      ));
      SourceManager.instance.removeSource(identifier);
    } else {
      floatingSnackBar('Inbuilt sources cannot be uninstalled (disable not yet supported)');
      return;
    }
    await getProviders();
    floatingSnackBar('Removed $identifier');
  }

  void _showAddRepoDialog() {
    final nameCtrl = TextEditingController();
    final urlCtrl = TextEditingController();
    ExtensionRuntime runtime = ExtensionRuntime.dart;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: appTheme.backgroundSubColor,
        title: Text('Add Repository', style: TextStyle(color: appTheme.textMainColor, fontFamily: 'Rubik')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Name (e.g. Mangayomi Anime)'),
            ),
            TextField(
              controller: urlCtrl,
              decoration: const InputDecoration(labelText: 'Index URL (.../index.json)'),
            ),
            const SizedBox(height: 12),
            DropdownButton<ExtensionRuntime>(
              value: runtime,
              items: ExtensionRuntime.values
                  .map((r) => DropdownMenuItem(value: r, child: Text(r.name)))
                  .toList(),
              onChanged: (v) {
                if (v != null) {
                  runtime = v;
                  (ctx as Element).markNeedsBuild();
                }
              },
            ),
            const SizedBox(height: 8),
            Text(
              'ShonenX-compatible: paste any Mangayomi, provins, or AniFox repo index.json URL.',
              style: TextStyle(color: appTheme.textSubColor, fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final name = nameCtrl.text.trim();
              final url = urlCtrl.text.trim();
              if (name.isEmpty || url.isEmpty) return;
              await _extManager.addRepo(ExtensionRepo(
                id: 'custom-${DateTime.now().millisecondsSinceEpoch}',
                name: name,
                indexUrl: url,
                runtime: runtime,
              ));
              if (ctx.mounted) Navigator.pop(ctx);
              await refreshRepos();
              await refreshAvailable();
              floatingSnackBar('Repository added');
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: appTheme.accentColor,
        foregroundColor: appTheme.onAccent,
        onPressed: _showAddRepoDialog,
        tooltip: 'Manage Repos (+)',
        child: const Icon(Icons.add),
      ),
      body: Padding(
        padding: MediaQuery.paddingOf(context),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: Icon(
                            Icons.arrow_back_rounded,
                            color: appTheme.textMainColor,
                            size: 28,
                          )),
                      Container(
                        padding: const EdgeInsets.only(left: 10, right: 20),
                        child: const Text(
                          "Extensions",
                          style: TextStyle(fontFamily: "Rubik", fontWeight: FontWeight.bold, fontSize: 20),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: refreshAvailable,
                        icon: Icon(Icons.refresh_rounded, size: 25, color: appTheme.textMainColor),
                        tooltip: 'Check for updates',
                      ),
                      IconButton(
                        onPressed: _showAddRepoDialog,
                        icon: Icon(Icons.source_rounded, size: 25, color: appTheme.textMainColor),
                        tooltip: 'Manage Repos',
                      ),
                    ],
                  )
                ],
              ),
            ),
            TabBar(
              controller: _tabController,
              labelColor: appTheme.accentColor,
              indicatorColor: appTheme.accentColor,
              unselectedLabelColor: appTheme.textSubColor,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontFamily: "NotoSans"),
              tabs: const [
                SizedBox(height: 50, child: Center(child: Text("Installed"))),
                SizedBox(height: 50, child: Center(child: Text("Available"))),
                SizedBox(height: 50, child: Center(child: Text("Repos"))),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _installedProviders == null
                      ? Center(child: AniFoxLoading(color: appTheme.accentColor))
                      : _installedList(_installedProviders!),
                  _availableBody(),
                  _reposBody(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _availableBody() {
    if (_loadingAvailable || _availableExtensions == null) {
      return Center(child: AniFoxLoading(color: appTheme.accentColor));
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Failed to load: $_error'),
            const SizedBox(height: 8),
            FilledButton(onPressed: refreshAvailable, child: const Text('Retry')),
          ],
        ),
      );
    }
    final data = _availableExtensions!;
    if (data.isEmpty) {
      return const Center(child: Text("Nothing to see here... All repos up to date."));
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: 16, bottom: 80),
      itemCount: data.length,
      itemBuilder: (context, index) => _extensionTile(data[index]),
    );
  }

  Widget _reposBody() {
    final repos = _repos;
    if (repos == null) return Center(child: AniFoxLoading(color: appTheme.accentColor));
    return ListView.builder(
      padding: const EdgeInsets.only(top: 16, bottom: 80),
      itemCount: repos.length,
      itemBuilder: (context, index) {
        final repo = repos[index];
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), color: appTheme.backgroundSubColor),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(repo.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    Text(repo.indexUrl, style: TextStyle(fontSize: 11, color: appTheme.textSubColor)),
                    Text('runtime: ${repo.runtime.name}',
                        style: TextStyle(fontSize: 12, color: appTheme.textSubColor)),
                  ],
                ),
              ),
              Switch(
                value: repo.enabled,
                activeThumbColor: appTheme.accentColor,
                onChanged: (v) async {
                  await _extManager.toggleRepo(repo.id, v);
                  await refreshRepos();
                  await refreshAvailable();
                },
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: ExtensionManager.defaultRepos.any((d) => d.id == repo.id)
                    ? null
                    : () async {
                        await _extManager.removeRepo(repo.id);
                        await refreshRepos();
                        await refreshAvailable();
                      },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _installedList(List<ProviderDetails> data) {
    if (data.isEmpty) return const Center(child: Text("Nothing to see here..."));
    return ListView.builder(
      padding: const EdgeInsets.only(top: 16, bottom: 80),
      itemCount: data.length,
      itemBuilder: (context, index) {
        final item = data[index];
        final isInbuilt = item.version == "0.0.0.0" || item.identifier.endsWith('_inbuilt');
        final isExt = item.identifier.contains(':');
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: appTheme.backgroundSubColor,
          ),
          clipBehavior: Clip.hardEdge,
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: item.icon != null
                    ? CachedNetworkImage(imageUrl: item.icon!, alignment: Alignment.center, height: 55, width: 55)
                    : Container(
                        height: 55,
                        width: 55,
                        alignment: Alignment.center,
                        color: appTheme.accentColor.withValues(alpha: 0.15),
                        child: Text(
                          item.name.isNotEmpty ? item.name[0].toUpperCase() : '?',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: appTheme.accentColor),
                        ),
                      ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text(
                        isInbuilt ? 'inbuilt' : 'v${item.version}${isExt ? " [extension]" : " [plugin]"}',
                        style: TextStyle(color: appTheme.textSubColor, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
              if (!isInbuilt)
                TextButton(
                  onPressed: () => _uninstallExtension(item.identifier),
                  style: TextButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                    backgroundColor: appTheme.accentColor,
                    foregroundColor: appTheme.onAccent,
                  ),
                  child: const Text("remove"),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: Icon(Icons.verified_rounded, color: appTheme.accentColor, size: 20),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _extensionTile(ExtensionSource item) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), color: appTheme.backgroundSubColor),
      clipBehavior: Clip.hardEdge,
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: item.iconUrl != null
                ? CachedNetworkImage(imageUrl: item.iconUrl!, alignment: Alignment.center, height: 55, width: 55)
                : Container(
                    height: 55,
                    width: 55,
                    alignment: Alignment.center,
                    color: appTheme.accentColor.withValues(alpha: 0.15),
                    child: Text(
                      item.name.isNotEmpty ? item.name[0].toUpperCase() : '?',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: appTheme.accentColor),
                    ),
                  ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(
                    'v${item.version ?? "1.0.0"} • ${item.runtime.name}${item.lang != null ? " • ${item.lang}" : ""}',
                    style: TextStyle(color: appTheme.textSubColor, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: TextButton(
              onPressed: () => _installExtension(item),
              style: TextButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                backgroundColor: appTheme.accentColor,
                foregroundColor: appTheme.onAccent,
              ),
              child: const Text("install"),
            ),
          )
        ],
      ),
    );
  }


}

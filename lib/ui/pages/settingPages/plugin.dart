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
/// - **Repos**: Manage Repos - add/remove/enable repo URLs (Mangayomi,
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
  final _searchCtrl = TextEditingController();

  List<ProviderDetails>? _installedProviders;
  List<ExtensionSource>? _installedExtensions;
  List<ExtensionSource>? _availableExtensions;
  List<ExtensionRepo>? _repos;
  bool _loadingAvailable = false;
  bool _checkingUpdates = false;
  String? _error;
  String _searchQuery = '';
  String? _langFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    getProviders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  /// Extensions matching the current search text + language filter.
  List<ExtensionSource> get _filteredAvailable {
    final all = _availableExtensions ?? [];
    return all.where((e) {
      if (_langFilter != null && (e.lang ?? 'en') != _langFilter) return false;
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return e.name.toLowerCase().contains(q) ||
          (e.baseUrl ?? '').toLowerCase().contains(q);
    }).toList();
  }

  /// Languages present in the available list (for the filter chips).
  List<String> get _availableLangs {
    final langs = <String>{};
    for (final e in _availableExtensions ?? []) {
      langs.add(e.lang ?? 'en');
    }
    final sorted = langs.toList()..sort();
    // Most useful first.
    sorted.sort((a, b) {
      int rank(String l) => l == 'en' ? 0 : (l == 'all' ? 1 : 2);
      final r = rank(a).compareTo(rank(b));
      return r != 0 ? r : a.compareTo(b);
    });
    return sorted;
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
      _installedExtensions = installedExt;
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
    setState(() {
      _loadingAvailable = true;
      _error = null;
    });
    try {
      final available = await _extManager.fetchAvailable();
      if (!mounted) return;
      setState(() {
        _availableExtensions = available;
        _loadingAvailable = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loadingAvailable = false;
      });
    }
  }

  Future<void> _checkForUpdates() async {
    setState(() => _checkingUpdates = true);
    try {
      await _extManager.checkForUpdates();
      await refreshAvailable();
      if (!mounted) return;
      floatingSnackBar('Update check complete');
    } catch (e) {
      if (!mounted) return;
      floatingSnackBar('Update check failed: $e');
    } finally {
      if (mounted) setState(() => _checkingUpdates = false);
    }
  }

  Future<void> _updateAll() async {
    setState(() => _checkingUpdates = true);
    try {
      await _extManager.updateAll();
      await refreshAvailable();
      if (!mounted) return;
      floatingSnackBar('All extensions updated');
    } catch (e) {
      if (!mounted) return;
      floatingSnackBar('Update failed: $e');
    } finally {
      if (mounted) setState(() => _checkingUpdates = false);
    }
  }

  Future<void> _installExtension(ExtensionSource item) async {
    try {
      await _extManager.install(item);
      await refreshAvailable();
      if (!mounted) return;
      floatingSnackBar('Installed ${item.name}');
    } catch (e) {
      if (!mounted) return;
      floatingSnackBar('Install failed: $e');
    }
  }

  Future<void> _updateExtension(ExtensionSource item) async {
    try {
      await _extManager.updateExtension(item.id);
      await refreshAvailable();
      if (!mounted) return;
      floatingSnackBar('Updated ${item.name}');
    } catch (e) {
      if (!mounted) return;
      floatingSnackBar('Update failed: $e');
    }
  }

  Future<void> _uninstallExtension(String id) async {
    try {
      await _extManager.uninstall(id);
      await refreshAvailable();
      if (!mounted) return;
      floatingSnackBar('Extension removed');
    } catch (e) {
      if (!mounted) return;
      floatingSnackBar('Uninstall failed: $e');
    }
  }

  Future<void> _showAddRepoDialog() async {
    final nameCtrl = TextEditingController();
    final urlCtrl = TextEditingController();
    ExtensionRuntime runtime = ExtensionRuntime.mangayomi;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        title: const Text('Add Repository'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            TextField(
              controller: urlCtrl,
              decoration: const InputDecoration(labelText: 'Index URL'),
            ),
            DropdownButtonFormField<ExtensionRuntime>(
              value: runtime,
              decoration: const InputDecoration(labelText: 'Runtime'),
              items: ExtensionRuntime.values
                  .map((r) => DropdownMenuItem(value: r, child: Text(r.name)))
                  .toList(),
              onChanged: (v) => runtime = v ?? ExtensionRuntime.mangayomi,
            ),
            const SizedBox(height: 8),
            Text(
              'Mangayomi-compatible: paste any Mangayomi, provins, or AniFox repo index.json URL.',
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 12),
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

  /// Builds the list of language filter chips.
  List<Widget> _buildLanguageChips() {
    if (_availableLangs.isEmpty) return [];
    final chips = <Widget>[
      FilterChip(
        label: const Text('All'),
        selected: _langFilter == null,
        onSelected: (_) => setState(() => _langFilter = null),
      ),
    ];
    for (final lang in _availableLangs) {
      chips.add(
        FilterChip(
          label: Text(lang.toUpperCase()),
          selected: _langFilter == lang,
          onSelected: (selected) => setState(() => _langFilter = selected ? lang : null),
        ),
      );
    }
    return chips;
  }

  List<Widget> _buildUpdateButtons() {
    if (_checkingUpdates) return [];
    return [
      Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: FilledButton.icon(
            onPressed: _checkForUpdates,
            icon: const Icon(Icons.system_update_alt_rounded),
            label: const Text('Check for Updates'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ),
      Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _updateAll,
              icon: const Icon(Icons.download_for_offline_rounded),
              label: const Text('Update All'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: appTheme.accentColor,
                foregroundColor: appTheme.onAccent,
              ),
            ),
          ),
        ),
      ),
    ];
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
                          )),
                      Text(
                        'Extensions',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: appTheme.textMainColor),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Installed'),
                Tab(text: 'Available'),
                Tab(text: 'Repos'),
              ],
              indicatorColor: appTheme.accentColor,
              labelColor: appTheme.accentColor,
              unselectedLabelColor: appTheme.textSubColor,
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

  Widget _installedList(List<ProviderDetails> providers) {
    return ListView.builder(
      padding: const EdgeInsets.only(top: 16, bottom: 80),
      itemCount: providers.length,
      itemBuilder: (context, index) {
        final item = providers[index];
        final isInbuilt = SourceManager.instance.inbuiltSources.any((i) => i.identifier == item.identifier);
        final isExt = _installedExtensions?.any((e) => e.id == item.identifier) ?? false;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), color: appTheme.backgroundSubColor),
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

    final available = _filteredAvailable;
    if (available.isEmpty) {
      return const Center(child: Text("Nothing to see here... All repos up to date."));
    }
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Search extensions...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _searchQuery = '');
                      }
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: appTheme.textSubColor.withAlpha(51)),
              ),
              filled: true,
              fillColor: appTheme.backgroundSubColor,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (v) => setState(() => _searchQuery = v.trim()),
          ),
        ),
        // Language filter chips
        if (_availableLangs.isNotEmpty) ...[
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              children: _buildLanguageChips(),
            ),
          ),
        ],
        const SizedBox(height: 8),
        // Check for Updates / Update All buttons
        Row(
          children: _buildUpdateButtons(),
        ),
        const SizedBox(height: 8),
        // Extensions list
        Expanded(
          child: _availableBodyList(),
        ),
      ],
    );
  }

  Widget _availableBodyList() {
    final data = _filteredAvailable;
    if (data.isEmpty) {
      return const Center(child: Text("Nothing to see here..."));
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: 16, bottom: 80),
      itemCount: _filteredAvailable.length,
      itemBuilder: (context, index) => _extensionTile(_filteredAvailable[index]),
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
                  if (item.hasUpdate)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: appTheme.accentColor.withAlpha(30),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.system_update_alt_rounded, size: 12, color: appTheme.accentColor),
                            const SizedBox(width: 4),
                            Text(
                              'Update available',
                              style: TextStyle(
                                color: appTheme.accentColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (item.hasUpdate)
                  TextButton(
                    onPressed: () => _updateExtension(item),
                    style: TextButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                      backgroundColor: appTheme.accentColor,
                      foregroundColor: appTheme.onAccent,
                    ),
                    child: const Text("Update"),
                  )
                else if (!item.isInstalled)
                  TextButton(
                    onPressed: () => _installExtension(item),
                    style: TextButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                      backgroundColor: appTheme.accentColor,
                      foregroundColor: appTheme.onAccent,
                    ),
                    child: const Text("install"),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: Icon(Icons.verified_rounded, color: appTheme.accentColor, size: 20),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
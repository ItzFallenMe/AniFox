import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/common/models/unified_media.dart';

mixin ContinueMediaMixin<T extends ConsumerStatefulWidget> on ConsumerState<T> {
  bool isLoading = false;

  void setLoading(bool loading) {
    if (!mounted || isLoading == loading) return;
    setState(() => isLoading = loading);
  }

  Future<void> handleResumeMedia({
    required Future<void> Function() resolveAndPlay,
  }) async {
    if (isLoading) return;

    setLoading(true);

    try {
      await resolveAndPlay();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not start playback: $e')),
      );
    } finally {
      setLoading(false);
    }
  }

  Future<void> showItemContextMenu({
    required Offset position,
    required MediaType mediaType,
    required String mediaTitle,
    required Future<void> Function() onRemoveHistory,
    VoidCallback? onViewDetails,
  }) async {
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;

    final value = await showMenu<String>(
      context: context,
      useRootNavigator: true,
      position: RelativeRect.fromRect(
        position & const Size(40, 40),
        Offset.zero & overlay.size,
      ),
      items: [
        if (onViewDetails != null)
          const PopupMenuItem(
            value: 'details',
            child: Row(
              children: [
                Icon(Icons.info_outline, size: 18),
                SizedBox(width: 8),
                Text('Open Details (No Play)'),
              ],
            ),
          ),
        const PopupMenuItem(
          value: 'remove_history',
          child: Row(
            children: [
              Icon(Icons.delete_outline, size: 18),
              SizedBox(width: 8),
              Text('Remove from History'),
            ],
          ),
        ),
      ],
    );

    if (value == null || !mounted) return;

    switch (value) {
      case 'details':
        onViewDetails?.call();
        break;

      case 'remove_history':
        await onRemoveHistory();

        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Removed from history')));
        }
        break;
    }
  }
}

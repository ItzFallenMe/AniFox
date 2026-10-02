import 'package:anifox/core/anime/providers/types.dart';
import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:flutter/material.dart';

class SourceTile extends StatefulWidget {
  final VideoStream source;
  final VoidCallback onTap;
  final bool selected;
  const SourceTile({
    super.key,
    required this.source,
    required this.onTap,
    this.selected = false,
  });

  @override
  State<SourceTile> createState() => _SourceTileState();
}

class _SourceTileState extends State<SourceTile> {
  bool hovered = false;
  @override
  Widget build(BuildContext context) {
    final radius = Appearance.cardRadius;
    final isBackup = widget.source.backup;
    return Padding(
      padding: EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () {
          softHaptic(HapticIntensity.selection);
          widget.onTap();
        },
        splashColor: Colors.transparent,
        splashFactory: NoSplash.splashFactory,
        onFocusChange: (val) {
          setState(() => hovered = val);
        },
        onHover: (val) {
          setState(() => hovered = val);
        },
        borderRadius: BorderRadius.circular(radius),
        child: AnimatedContainer(
          duration: Duration(milliseconds: 100),
          padding: EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          decoration: BoxDecoration(
            color: widget.selected
                ? appTheme.accentColor.withAlpha(60)
                : hovered
                    ? appTheme.backgroundSubColor.withAlpha(242)
                    : appTheme.backgroundSubColor,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: widget.selected
                  ? appTheme.accentColor
                  : hovered
                      ? appTheme.accentColor.withAlpha(178)
                      : Colors.transparent,
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(38),
                blurRadius: 12,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(
                isBackup ? Icons.cloud_queue_rounded : Icons.video_library_rounded,
                color: appTheme.accentColor,
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            widget.source.server,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: appTheme.textMainColor,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isBackup)
                          Container(
                            margin: EdgeInsets.only(left: 8),
                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: appTheme.accentColor.withAlpha(40),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              "Backup",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: appTheme.accentColor,
                              ),
                            ),
                          ),
                        if (widget.source.subtitle != null)
                          Container(
                            margin: EdgeInsets.only(left: 6),
                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: appTheme.textSubColor.withAlpha(30),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              "CC",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: appTheme.textSubColor,
                              ),
                            ),
                          ),
                      ],
                    ),
                    SizedBox(height: 4),
                    Text(
                      widget.source.quality,
                      style: TextStyle(
                        fontSize: 14,
                        color: appTheme.textSubColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(
                widget.selected ? Icons.check_circle_rounded : Icons.chevron_right,
                color: widget.selected ? appTheme.accentColor : appTheme.textSubColor,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/ui/models/providers/infoProvider.dart';
import 'package:flutter/material.dart';

class BatchDownloadSheetContent extends StatefulWidget {
  final InfoProvider provider;
  const BatchDownloadSheetContent({super.key, required this.provider});

  @override
  State<BatchDownloadSheetContent> createState() => _BatchDownloadSheetContentState();
}

class _BatchDownloadSheetContentState extends State<BatchDownloadSheetContent> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, right: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Batch Download",
            style: TextStyle(
              color: appTheme.textMainColor,
              fontFamily: "Rubik",
              fontSize: 23,
              fontWeight: FontWeight.bold,
            ),
          ),
          Row(),
        ],
      ),
    );
  }
}

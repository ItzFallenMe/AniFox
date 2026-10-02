import "dart:io";

import "package:anifox/main.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";

void floatingSnackBar(String message, {int? duration, bool waitForPreviousToFinish = false}) {
  final isWindows = Platform.isWindows;
  if (!waitForPreviousToFinish) AniFox.snackbarKey.currentState?.removeCurrentSnackBar();
  AniFox.snackbarKey.currentState?.showSnackBar(
      SnackBar(
        content: Center(
          child: Text(message, style: TextStyle(fontFamily: "NotoSans", color: Colors.white, fontSize: 14)),
        ),
        duration: Duration(seconds: duration != null ? duration : 3),
        backgroundColor: Color.fromARGB(244, 61, 61, 61),
        behavior: SnackBarBehavior.floating,
        dismissDirection: DismissDirection.down,
        margin: isWindows ? null : EdgeInsets.only(bottom: 40, left: 20, right: 20),
        width: isWindows ? MediaQuery.of(AniFox.snackbarKey.currentState!.context).size.width / 5 : null,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
}

/// Action snackbar (e.g. Undo) — returns true when the action was tapped.
Future<bool> floatingSnackBarWithAction(
  String message, {
  String actionLabel = "Undo",
  int duration = 4,
}) async {
  bool tapped = false;
  final isWindows = Platform.isWindows;
  AniFox.snackbarKey.currentState?.removeCurrentSnackBar();
  AniFox.snackbarKey.currentState?.showSnackBar(
    SnackBar(
      content: Center(
        child: Text(message, style: TextStyle(fontFamily: "NotoSans", color: Colors.white, fontSize: 14)),
      ),
      duration: Duration(seconds: duration),
      backgroundColor: Color.fromARGB(244, 61, 61, 61),
      behavior: SnackBarBehavior.floating,
      dismissDirection: DismissDirection.down,
      margin: isWindows ? null : EdgeInsets.only(bottom: 40, left: 20, right: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      action: SnackBarAction(
        label: actionLabel,
        textColor: Colors.amber,
        onPressed: () => tapped = true,
      ),
    ),
  );
  await Future.delayed(Duration(seconds: duration));
  return tapped;
}

void showToast(String message) async {
  final platform = MethodChannel('anifox.app/utils');
  await platform.invokeMethod("showToast", {'message': message});
}
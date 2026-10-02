import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/core/data/types.dart';
import 'package:anifox/ui/models/providers/appProvider.dart';
import 'package:anifox/ui/theme/anifox.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:anifox/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // The app reads the global theme synchronously on first build, so seed
    // the default (id 0) theme like loadAndAssignSettings() would.
    currentUserSettings = SettingsModal(darkMode: true);
    appTheme = AniFoxBrand().theme;

    // Mirror main(): AniFox requires AppProvider above it.
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (context) => AppProvider(),
        child: const AniFox(),
      ),
    );
    expect(find.byType(AniFox), findsOneWidget);
  });
}

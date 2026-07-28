import 'package:flutter_test/flutter_test.dart';
import 'package:anifox/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AniFox());
    expect(find.byType(AniFox), findsOneWidget);
  });
}

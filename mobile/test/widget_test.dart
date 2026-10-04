import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Material app renders a frame', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: Text('B2B Sales')),
      ),
    );

    expect(find.text('B2B Sales'), findsOneWidget);
  });
}

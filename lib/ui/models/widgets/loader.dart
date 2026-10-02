
import 'dart:math' as math;
import 'package:flutter/material.dart';

// HMM used an AI, Im just a vibe coder atp ig
class AniFoxLoading extends StatefulWidget {
  final Color color;
  final double size;
  final Duration duration;
  final String? label;

  const AniFoxLoading({
    Key? key,
    this.color = Colors.purple,
    this.size = 80.0,
    this.duration = const Duration(milliseconds: 1800),
    this.label,
  }) : super(key: key);

  /// Compact inline spinner for buttons / list tiles.
  const AniFoxLoading.compact({
    Key? key,
    this.color = Colors.purple,
    this.label,
  })  : size = 28.0,
        duration = const Duration(milliseconds: 1200),
        super(key: key);

  @override
  _AniFoxLoadingState createState() => _AniFoxLoadingState();
}

class _AniFoxLoadingState extends State<AniFoxLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Semantics(
        label: widget.label ?? 'Loading',
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: widget.size,
              height: widget.size,
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return CustomPaint(
                    painter: _SimpleAnimePainter(
                      color: widget.color,
                      animation: _controller,
                    ),
                  );
                },
              ),
            ),
            if (widget.label != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  widget.label!,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Determinate thin progress bar matching the loader's accent.
class AniFoxProgressBar extends StatelessWidget {
  final double progress;
  final Color color;
  final double height;
  const AniFoxProgressBar({
    super.key,
    required this.progress,
    required this.color,
    this.height = 4,
  });

  @override
  Widget build(BuildContext context) {
    final p = progress.clamp(0.0, 1.0);
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: LinearProgressIndicator(
        value: p,
        minHeight: height,
        backgroundColor: color.withAlpha(40),
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }
}

class _SimpleAnimePainter extends CustomPainter {
  final Color color;
  final Animation<double> animation;

  _SimpleAnimePainter({
    required this.color,
    required this.animation,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    
    for (int i = 0; i < 3; i++) {
      final angle = animation.value * math.pi * 2 + (i * 2 * math.pi / 3);
      final orbitRadius = radius * 0.6;
      final x = center.dx + orbitRadius * math.cos(angle);
      final y = center.dy + orbitRadius * math.sin(angle);
 
      final pulseFactor = 0.6 + 0.4 * math.sin(animation.value * math.pi * 2 + i * math.pi * 2 / 3);
      final dotRadius = radius * 0.15 * pulseFactor;

      final alpha = (179 + 76 * pulseFactor).toInt().clamp(0, 255);
      
      final paint = Paint()
        ..color = color.withAlpha(alpha)
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(Offset(x, y), dotRadius, paint);
    }
    
    final centerPulseFactor = 0.8 + 0.2 * math.sin(animation.value * math.pi * 4);
    final centerPaint = Paint()
      ..color = color.withAlpha((128 * centerPulseFactor).toInt().clamp(0, 255))
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, radius * 0.25 * centerPulseFactor, centerPaint);
    
    final ringPaint = Paint()
      ..color = color.withAlpha(76)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    canvas.drawCircle(center, radius * 0.6, ringPaint);
  }

  @override
  bool shouldRepaint(_SimpleAnimePainter oldDelegate) {
    return true;
  }
}
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/router/app_navigator.dart';
import 'package:anifox/modules/welcome/onboarding_provider.dart';
import 'package:anifox/modules/launch/ui/splash_quotes.dart';
import 'package:anifox/common/widgets/app_scaffold.dart';
import 'package:anifox/common/widgets/app_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  String _status = 'Setting up runtime environment...';
  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;
  late SplashQuote _currentQuote;
  Timer? _quoteTimer;

  @override
  void initState() {
    super.initState();
    _currentQuote = SplashQuotes.getRandomQuote();
    _scheduleNextQuote();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    _animController.forward();
    _initializeApp();
  }

  int _calculateReadingTime(String quote) {
    final msPerChar = quote.length * 40;
    return msPerChar.clamp(2800, 7000);
  }

  void _scheduleNextQuote() {
    _quoteTimer?.cancel();
    final durationMs = _calculateReadingTime(_currentQuote.quote);

    _quoteTimer = Timer(Duration(milliseconds: durationMs), () {
      if (mounted) {
        setState(() {
          _currentQuote = SplashQuotes.getRandomQuote(_currentQuote);
        });
        _scheduleNextQuote();
      }
    });
  }

  @override
  void dispose() {
    _quoteTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    final stopwatch = Stopwatch()..start();
    final requiredReadingTime = _calculateReadingTime(_currentQuote.quote);

    stopwatch.stop();
    final elapsedMs = stopwatch.elapsedMilliseconds;
    final remainingMs = requiredReadingTime - elapsedMs;

    if (remainingMs > 0) {
      await Future.delayed(Duration(milliseconds: remainingMs));
    }

    if (!mounted) return;
    setState(() {
      _status = 'Ready';
    });

    final onboardingComplete = ref.read(onboardingProvider);
    if (onboardingComplete) {
      context.goHome();
    } else {
      context.goOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AppScaffold(
      body: Center(
        child: AnimatedBuilder(
          animation: _animController,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Hero(
                      tag: 'app_logo',
                      child: AppLogo(size: 140),
                    ),
                    const SizedBox(height: 48),
                    SizedBox(
                      width: 200,
                      child: Column(
                        children: [
                          LinearProgressIndicator(
                            color: cs.primary,
                            backgroundColor: cs.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(4),
                            minHeight: 4,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _status,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: cs.onSurfaceVariant,
                                  letterSpacing: 0.5,
                                  fontWeight: FontWeight.w600,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          maxWidth: 440,
                          minHeight: 80,
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 600),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          transitionBuilder: (child, animation) {
                            return FadeTransition(
                              opacity: animation,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, 0.15),
                                  end: Offset.zero,
                                ).animate(animation),
                                child: child,
                              ),
                            );
                          },
                          child: Column(
                            key: ValueKey<String>(_currentQuote.quote),
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '“${_currentQuote.quote}”',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: cs.onSurface.withValues(
                                        alpha: 0.88,
                                      ),
                                      fontStyle: FontStyle.italic,
                                      height: 1.4,
                                      letterSpacing: 0.2,
                                    ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '— ${_currentQuote.formattedAuthor}',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      color: cs.primary.withValues(alpha: 0.95),
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

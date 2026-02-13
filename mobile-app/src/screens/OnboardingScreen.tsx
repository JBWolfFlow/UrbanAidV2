import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

import { tokens } from '../theme/tokens';
import { colors } from '../theme/colors';
import { GradientButton } from '../components/ui/GradientButton';
import { useOnboardingStore } from '../stores/onboardingStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_COUNT = 3;

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const CityHeartIcon = () => (
  <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* Buildings */}
    <Rect x="20" y="60" width="24" height="80" rx="4" fill="rgba(255,255,255,0.25)" />
    <Rect x="24" y="68" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="34" y="68" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="24" y="84" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="34" y="84" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="50" y="40" width="28" height="100" rx="4" fill="rgba(255,255,255,0.3)" />
    <Rect x="55" y="48" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="67" y="48" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="55" y="64" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="67" y="64" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="55" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="67" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="84" y="50" width="24" height="90" rx="4" fill="rgba(255,255,255,0.2)" />
    <Rect x="88" y="58" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="98" y="58" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="88" y="74" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="98" y="74" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="114" y="70" width="26" height="70" rx="4" fill="rgba(255,255,255,0.25)" />
    <Rect x="118" y="78" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    <Rect x="130" y="78" width="6" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
    {/* Heart overlay */}
    <Path
      d="M80 55 C80 45, 68 35, 58 45 C48 55, 58 65, 80 80 C102 65, 112 55, 102 45 C92 35, 80 45, 80 55Z"
      fill="rgba(255,107,107,0.6)"
      stroke="rgba(255,255,255,0.8)"
      strokeWidth="2"
    />
  </Svg>
);

const MapPinIcon = () => (
  <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* Map base */}
    <Rect x="20" y="40" width="120" height="90" rx="12" fill="rgba(255,255,255,0.15)" />
    {/* Grid lines */}
    <Path d="M20 70 L140 70" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <Path d="M20 95 L140 95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <Path d="M60 40 L60 130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <Path d="M100 40 L100 130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    {/* Pin 1 (main) */}
    <Path
      d="M80 30 C68 30, 58 40, 58 52 C58 72, 80 90, 80 90 C80 90, 102 72, 102 52 C102 40, 92 30, 80 30Z"
      fill="rgba(255,107,107,0.8)"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth="2"
    />
    <Circle cx="80" cy="52" r="8" fill="rgba(255,255,255,0.9)" />
    {/* Pin 2 (small, left) */}
    <Path
      d="M40 65 C35 65, 31 69, 31 73.5 C31 80, 40 87, 40 87 C40 87, 49 80, 49 73.5 C49 69, 45 65, 40 65Z"
      fill="rgba(102,126,234,0.7)"
    />
    <Circle cx="40" cy="73.5" r="3.5" fill="rgba(255,255,255,0.8)" />
    {/* Pin 3 (small, right) */}
    <Path
      d="M115 75 C110 75, 106 79, 106 83.5 C106 90, 115 97, 115 97 C115 97, 124 90, 124 83.5 C124 79, 120 75, 115 75Z"
      fill="rgba(46,213,115,0.7)"
    />
    <Circle cx="115" cy="83.5" r="3.5" fill="rgba(255,255,255,0.8)" />
  </Svg>
);

const CommunityIcon = () => (
  <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* Center person */}
    <Circle cx="80" cy="55" r="16" fill="rgba(255,255,255,0.35)" />
    <Path
      d="M58 95 C58 80, 68 72, 80 72 C92 72, 102 80, 102 95"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Left person */}
    <Circle cx="40" cy="68" r="12" fill="rgba(255,255,255,0.2)" />
    <Path
      d="M24 100 C24 88, 31 82, 40 82 C49 82, 56 88, 56 100"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right person */}
    <Circle cx="120" cy="68" r="12" fill="rgba(255,255,255,0.2)" />
    <Path
      d="M104 100 C104 88, 111 82, 120 82 C129 82, 136 88, 136 100"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {/* Connection lines */}
    <Path
      d="M55 65 L65 60"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    <Path
      d="M95 60 L105 65"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    {/* Heart in center below */}
    <Path
      d="M80 115 C80 111, 75 108, 72 111 C69 114, 72 118, 80 125 C88 118, 91 114, 88 111 C85 108, 80 111, 80 115Z"
      fill="rgba(255,107,107,0.6)"
    />
  </Svg>
);

// ─── Slide Data ──────────────────────────────────────────────────────────────

interface SlideData {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features?: { emoji: string; title: string; desc: string }[];
}

const slides: SlideData[] = [
  {
    title: 'Welcome to\nUrbanAid',
    subtitle:
      'Connecting communities to essential resources\u2009—\u2009water, shelter, food, and more\u2009—\u2009right where you need them.',
    icon: <CityHeartIcon />,
  },
  {
    title: 'Discover\nWhat\u2019s Nearby',
    subtitle:
      'Find water fountains, restrooms, shelters, clinics, food banks, and dozens more on an interactive map.',
    icon: <MapPinIcon />,
    features: [
      { emoji: '\uD83D\uDCCD', title: 'Explore the Map', desc: 'Find utilities near you' },
      { emoji: '\uD83D\uDD0D', title: 'Smart Search', desc: 'Filter by category & distance' },
      { emoji: '\uD83D\uDC65', title: 'Community Powered', desc: 'Add and verify resources' },
    ],
  },
  {
    title: 'Your City,\nYour Community',
    subtitle:
      'Every pin on the map is a lifeline. Start exploring and help others find what they need.',
    icon: <CommunityIcon />,
  },
];

// ─── Floating Glass Shape ────────────────────────────────────────────────────

const FloatingShape = ({
  size,
  startX,
  startY,
  driftX,
  driftY,
  delay,
}: {
  size: number;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  delay: number;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(driftX, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(driftY, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        },
        animatedStyle,
      ]}
    >
      <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(255,255,255,0.08)' },
          ]}
        />
      </BlurView>
    </Animated.View>
  );
};

// ─── Feature Card (Slide 2) ──────────────────────────────────────────────────

const FeatureCard = ({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) => (
  <View style={featureStyles.card}>
    <Text style={featureStyles.emoji}>{emoji}</Text>
    <View style={featureStyles.textWrap}>
      <Text style={featureStyles.title}>{title}</Text>
      <Text style={featureStyles.desc}>{desc}</Text>
    </View>
  </View>
);

const featureStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: tokens.radius.card,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },
  emoji: {
    fontSize: 24,
    marginRight: tokens.spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: tokens.typography.titleSmall.fontSize,
    fontWeight: tokens.typography.titleSmall.fontWeight,
    marginBottom: 2,
  },
  desc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: tokens.typography.bodySmall.fontSize,
    fontWeight: tokens.typography.bodySmall.fontWeight,
  },
});

// ─── Dot Indicator ───────────────────────────────────────────────────────────

const DotIndicator = ({ scrollX }: { scrollX: Animated.SharedValue<number> }) => (
  <View style={dotStyles.container}>
    {slides.map((_, i) => {
      const animatedDot = useAnimatedStyle(() => {
        const inputRange = [
          (i - 1) * SCREEN_WIDTH,
          i * SCREEN_WIDTH,
          (i + 1) * SCREEN_WIDTH,
        ];
        const width = interpolate(
          scrollX.value,
          inputRange,
          [8, 24, 8],
          Extrapolation.CLAMP
        );
        const opacity = interpolate(
          scrollX.value,
          inputRange,
          [0.3, 1, 0.3],
          Extrapolation.CLAMP
        );
        return { width, opacity };
      });

      return (
        <Animated.View key={i} style={[dotStyles.dot, animatedDot]} />
      );
    })}
  </View>
);

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { completeOnboarding } = useOnboardingStore();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Skip button: fades out approaching slide 3
  const skipStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [SCREEN_WIDTH * 1.2, SCREEN_WIDTH * 1.8],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Get Started button: fades in + slides up on slide 3
  const ctaStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [SCREEN_WIDTH * 1.5, SCREEN_WIDTH * 2],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [SCREEN_WIDTH * 1.5, SCREEN_WIDTH * 2],
      [40, 0],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  const handleSkip = () => {
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * 2, animated: true });
  };

  const handleGetStarted = () => {
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating glass shapes */}
      <FloatingShape size={120} startX={-30} startY={SCREEN_HEIGHT * 0.15} driftX={40} driftY={-30} delay={0} />
      <FloatingShape size={100} startX={SCREEN_WIDTH - 80} startY={SCREEN_HEIGHT * 0.55} driftX={-35} driftY={25} delay={600} />
      <FloatingShape size={80} startX={SCREEN_WIDTH * 0.3} startY={SCREEN_HEIGHT * 0.75} driftX={25} driftY={-40} delay={1200} />

      {/* Swipeable slides */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        bounces={false}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <SlideView
            key={index}
            slide={slide}
            index={index}
            scrollX={scrollX}
            topInset={insets.top}
          />
        ))}
      </Animated.ScrollView>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + tokens.spacing.lg }]}>
        {/* Skip (slides 1-2) and Get Started (slide 3) share this space */}
        <View style={styles.buttonArea}>
          <Animated.View style={[styles.skipWrap, skipStyle]}>
            <Pressable onPress={handleSkip} hitSlop={tokens.hitSlop.medium}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </Animated.View>
          <Animated.View style={[styles.ctaWrap, ctaStyle]}>
            <GradientButton
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="lg"
              fullWidth
            />
          </Animated.View>
        </View>

        {/* Dot indicator — very bottom */}
        <DotIndicator scrollX={scrollX} />
      </View>
    </View>
  );
};

// ─── Individual Slide ────────────────────────────────────────────────────────

const SlideView = ({
  slide,
  index,
  scrollX,
  topInset,
}: {
  slide: SlideData;
  index: number;
  scrollX: Animated.SharedValue<number>;
  topInset: number;
}) => {
  const baseOffset = index * SCREEN_WIDTH;

  // Parallax: icon moves at 1.0×, title at 0.7×, subtitle at 0.5×
  const iconStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH, baseOffset, baseOffset + SCREEN_WIDTH],
      [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH * 0.6, baseOffset, baseOffset + SCREEN_WIDTH * 0.6],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateX }], opacity };
  });

  const titleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH, baseOffset, baseOffset + SCREEN_WIDTH],
      [SCREEN_WIDTH * 0.2, 0, -SCREEN_WIDTH * 0.2],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH * 0.6, baseOffset, baseOffset + SCREEN_WIDTH * 0.6],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateX }], opacity };
  });

  const subtitleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH, baseOffset, baseOffset + SCREEN_WIDTH],
      [SCREEN_WIDTH * 0.15, 0, -SCREEN_WIDTH * 0.15],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [baseOffset - SCREEN_WIDTH * 0.6, baseOffset, baseOffset + SCREEN_WIDTH * 0.6],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateX }], opacity };
  });

  // Entrance stagger: each element gets a progressive translateY
  const entranceIcon = useAnimatedStyle(() => {
    const dist = Math.abs(scrollX.value - baseOffset) / SCREEN_WIDTH;
    const translateY = interpolate(dist, [0, 1], [0, 30], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  const entranceTitle = useAnimatedStyle(() => {
    const dist = Math.abs(scrollX.value - baseOffset) / SCREEN_WIDTH;
    const translateY = interpolate(dist, [0, 1], [0, 45], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  const entranceSubtitle = useAnimatedStyle(() => {
    const dist = Math.abs(scrollX.value - baseOffset) / SCREEN_WIDTH;
    const translateY = interpolate(dist, [0, 1], [0, 60], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { paddingTop: topInset + tokens.spacing.xxxl }]}>
      {/* Icon */}
      <Animated.View style={[styles.iconWrap, iconStyle, entranceIcon]}>
        {slide.icon}
      </Animated.View>

      {/* Title */}
      <Animated.View style={[titleStyle, entranceTitle]}>
        <Text style={styles.title}>{slide.title}</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={[subtitleStyle, entranceSubtitle]}>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      {/* Feature cards (slide 2 only) */}
      {slide.features && (
        <Animated.View style={[styles.featureList, subtitleStyle, entranceSubtitle]}>
          {slide.features.map((f, i) => (
            <FeatureCard key={i} emoji={f.emoji} title={f.title} desc={f.desc} />
          ))}
        </Animated.View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: tokens.spacing.xl,
    justifyContent: 'flex-start',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
    marginTop: tokens.spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontSize: tokens.typography.displaySmall.fontSize,
    fontWeight: tokens.typography.displaySmall.fontWeight,
    lineHeight: tokens.typography.displaySmall.lineHeight,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: tokens.typography.bodyLarge.fontWeight,
    lineHeight: tokens.typography.bodyLarge.lineHeight,
    textAlign: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  featureList: {
    marginTop: tokens.spacing.xl,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.xl,
  },
  buttonArea: {
    height: 36,
    marginBottom: tokens.spacing.md,
    overflow: 'visible',
  },
  skipWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: tokens.typography.titleSmall.fontSize,
    fontWeight: tokens.typography.titleSmall.fontWeight,
    paddingVertical: tokens.spacing.md,
  },
  ctaWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default OnboardingScreen;

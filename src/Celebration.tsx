import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";

// Confetti + fireworks overlay for the champion reveal. Pure Animated, no
// extra dependencies; loops until unmounted and never blocks touches.

const COLORS = ["#E63946", "#F4C430", "#2A9D8F", "#457B9D", "#F4A261", "#ffffff", "#B5179E"];
const CONFETTI_COUNT = 70;
const BURSTS = [
  { x: 0.22, y: 0.22, delay: 0 },
  { x: 0.78, y: 0.18, delay: 700 },
  { x: 0.5, y: 0.32, delay: 1400 },
  { x: 0.3, y: 0.42, delay: 2100 },
  { x: 0.72, y: 0.4, delay: 2800 },
];
const SPARKS = 14;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function ConfettiPiece({ width, height }: { width: number; height: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const piece = useMemo(
    () => ({
      x: Math.random() * width,
      drift: (Math.random() - 0.5) * 120,
      size: 6 + Math.random() * 8,
      color: pick(COLORS),
      duration: 2600 + Math.random() * 2200,
      delay: Math.random() * 2500,
      spins: 2 + Math.random() * 4,
      round: Math.random() < 0.3,
    }),
    [width]
  );

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: piece.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [piece, progress]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: piece.x,
        top: 0,
        width: piece.size,
        height: piece.round ? piece.size : piece.size * 0.45,
        borderRadius: piece.round ? piece.size / 2 : 1,
        backgroundColor: piece.color,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-30, height + 30],
            }),
          },
          {
            translateX: progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, piece.drift, -piece.drift / 2],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", `${piece.spins * 360}deg`],
            }),
          },
        ],
      }}
    />
  );
}

function Firework({ x, y, delay }: { x: number; y: number; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const color = useMemo(() => pick(COLORS.filter((c) => c !== "#ffffff")), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3500 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [delay, progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 0.8, 0],
  });

  return (
    <View style={{ position: "absolute", left: x, top: y }}>
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2;
        const radius = 90;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i % 3 === 0 ? "#fff" : color,
              opacity,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(angle) * radius],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(angle) * radius + 30],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

export function Celebration() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BURSTS.map((b, i) => (
        <Firework key={i} x={b.x * width} y={b.y * height} delay={b.delay} />
      ))}
      {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
        <ConfettiPiece key={i} width={width} height={height} />
      ))}
    </View>
  );
}

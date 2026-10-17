import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Celebration } from "../../../src/Celebration";
import { useData } from "../../../src/DataContext";
import { ordinal } from "../../../src/format";
import { computeStandings, StandingEntry } from "../../../src/scoring";

// Full-screen, one-at-a-time results reveal: last place first, champion last.
// Racers tied on points are revealed together.
export default function ResultsReveal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { competitions, getRacerById } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const competition = competitions.find((c) => c.id === id);
  const groups = useMemo(() => {
    if (!competition) return [];
    const byRank = new Map<number, StandingEntry[]>();
    for (const entry of computeStandings(competition)) {
      byRank.set(entry.rank, [...(byRank.get(entry.rank) ?? []), entry]);
    }
    return Array.from(byRank.values()).reverse();
  }, [competition]);

  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const nameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!revealed) {
      nameAnim.setValue(0);
      return;
    }
    Animated.spring(nameAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [revealed, step, nameAnim]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace(`/competition/${id}`);
  }

  if (!competition || groups.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.teaser}>No results to show.</Text>
        <Pressable style={styles.button} onPress={close}>
          <Text style={styles.buttonText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const group = groups[step];
  const isChampion = group[0].rank === 1;
  const isLast = step === groups.length - 1;
  const tied = group.length > 1;
  const points = group[0].points;
  const pointsText = `${points} ${points === 1 ? "point" : "points"}`;

  let heading: string;
  if (isChampion) heading = tied ? "Your co-champions" : "Your champion";
  else heading = `${tied ? "Tied for " : ""}${ordinal(group[0].rank)} place`;

  function handleButton() {
    if (!revealed) {
      setRevealed(true);
    } else if (!isLast) {
      setStep((s) => s + 1);
      setRevealed(false);
    } else {
      close();
    }
  }

  let buttonLabel: string;
  if (!revealed) buttonLabel = "Reveal";
  else if (isLast) buttonLabel = "Done";
  else {
    const next = groups[step + 1][0].rank;
    buttonLabel = next === 1 ? "Reveal the Champion" : `Next: ${ordinal(next)} place`;
  }

  const nameStyle = {
    opacity: nameAnim,
    transform: [
      { scale: nameAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
    ],
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {isChampion && revealed && <Celebration />}

      <View style={styles.topBar}>
        <Text style={styles.compName} numberOfLines={1}>
          {competition.name} · Final Results
        </Text>
        <Pressable onPress={close} hitSlop={12}>
          <Ionicons name="close" size={28} color="#888" />
        </Pressable>
      </View>

      <View style={styles.stage}>
        {isChampion && (
          <Ionicons name="trophy" size={64} color="#F4C430" style={styles.trophy} />
        )}
        <Text style={[styles.heading, isChampion && styles.championHeading]}>
          {heading}
        </Text>
        <Text style={styles.points}>with {pointsText}</Text>
        <Text style={styles.teaser}>{tied ? "are..." : "is..."}</Text>

        <Animated.View style={[styles.names, nameStyle]}>
          {revealed &&
            group.map((entry) => {
              const racer = getRacerById(entry.racerId);
              return (
                <View key={entry.racerId} style={styles.nameRow}>
                  <View
                    style={[styles.colorDot, { backgroundColor: racer?.color ?? "#ccc" }]}
                  />
                  <Text
                    style={[styles.name, isChampion && styles.championName]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {racer?.name ?? "Unknown"}
                  </Text>
                </View>
              );
            })}
        </Animated.View>
      </View>

      <View style={styles.progress}>
        {groups.map((g, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>

      <Pressable
        style={[styles.button, isChampion && !revealed && styles.championButton]}
        onPress={handleButton}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", paddingHorizontal: 24 },
  centered: { alignItems: "center", justifyContent: "center", gap: 24 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  compName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  trophy: { marginBottom: 12 },
  heading: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  championHeading: { color: "#F4C430" },
  points: { fontSize: 20, color: "#bbb", marginTop: 8 },
  teaser: { fontSize: 22, color: "#888", marginTop: 4, fontStyle: "italic" },
  names: { marginTop: 32, minHeight: 120, alignItems: "center", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  name: { fontSize: 44, fontWeight: "800", color: "#fff", textAlign: "center" },
  championName: { fontSize: 52, color: "#F4C430" },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotOn: { backgroundColor: "#E63946" },
  button: {
    backgroundColor: "#E63946",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
  },
  championButton: { backgroundColor: "#D4A017" },
  buttonText: { color: "#fff", fontSize: 19, fontWeight: "800" },
});

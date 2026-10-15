import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useData } from "../src/DataContext";
import { formatDate } from "../src/format";

export default function CompetitionNew() {
  const { racers, createCompetition } = useData();
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleStart() {
    const finalName = name.trim() || `Race Day – ${formatDate(Date.now())}`;
    const competition = createCompetition(finalName, selected);
    router.replace(`/competition/${competition.id}`);
  }

  if (racers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="car-sport-outline" size={48} color="#aaa" />
        <Text style={styles.emptyText}>Add racers first</Text>
        <Text style={styles.emptySubtext}>
          You need at least one racer before starting a competition.
        </Text>
        <Pressable
          style={styles.saveButton}
          onPress={() => router.replace("/racer-form")}
        >
          <Text style={styles.saveButtonText}>Add a Racer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Competition Name (optional)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={`Race Day – ${formatDate(Date.now())}`}
        />
        <Text style={styles.label}>Select Racers</Text>
      </View>

      <FlatList
        data={racers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable style={styles.row} onPress={() => toggle(item.id)}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.rowName}>{item.name}</Text>
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={24}
                color={isSelected ? "#E63946" : "#ccc"}
              />
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, selected.length === 0 && styles.disabled]}
          onPress={handleStart}
          disabled={selected.length === 0}
        >
          <Text style={styles.saveButtonText}>
            Start Competition{selected.length > 0 ? ` (${selected.length})` : ""}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    gap: 12,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  rowName: { flex: 1, fontSize: 16, fontWeight: "500", color: "#111" },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  saveButton: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabled: { opacity: 0.4 },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 6,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubtext: { fontSize: 14, color: "#999", textAlign: "center", marginBottom: 16 },
});

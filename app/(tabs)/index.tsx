import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useData } from "../../src/DataContext";

export default function RacersScreen() {
  const { racers, loading } = useData();
  const router = useRouter();

  const sorted = [...racers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      {!loading && (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            sorted.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-sport-outline" size={48} color="#aaa" />
              <Text style={styles.emptyText}>No racers yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first racer to get started
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({ pathname: "/racer-form", params: { id: item.id } })
              }
            >
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                {item.carNumber ? (
                  <Text style={styles.subtext}>Car #{item.carNumber}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </Pressable>
          )}
        />
      )}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/racer-form")}
        accessibilityLabel="Add racer"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 6,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubtext: { fontSize: 14, color: "#999" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    gap: 12,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  rowText: { flex: 1 },
  name: { fontSize: 17, fontWeight: "600", color: "#111" },
  subtext: { fontSize: 13, color: "#888", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E63946",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});

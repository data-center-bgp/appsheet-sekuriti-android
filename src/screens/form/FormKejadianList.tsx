import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Text, Card, Button, ListItem } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function FormKejadianList({ navigation }: { navigation: any }) {
  const [formKejadian, setFormKejadian] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFormKejadian();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchFormKejadian();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchFormKejadian() {
    try {
      setLoading(true);
      let { data: form_kejadian, error } = await supabase
        .from("form_kejadian")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (form_kejadian) {
        console.log("Fetched form kejadian:", form_kejadian);
        setFormKejadian(formKejadian);
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching form kejadian:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    fetchFormKejadian();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text h4>Daftar Form Kejadian</Text>
          <Button
            title="Tambah Baru"
            onPress={() => navigation.navigate("FormKejadianCreate")}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : formKejadian.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.errorText}>
              Belum ada data yang dimasukkan!
            </Text>
          </Card>
        ) : (
          <Card containerStyle={styles.card}>
            {formKejadian.map((item) => (
              <ListItem key={item.id} bottomDivider>
                <ListItem.Content>
                  <View style={styles.titleContainer}>
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.dateTime}>
                        {item.tanggal || "-"} | {item.jam || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewContent}>
                    <Text>ID: {item.ID || "-"}</Text>
                    <Text>Kejadian: {item.kejadian || "-"}</Text>
                    <Text>Lokasi: {item.nama_penerima || "-"}</Text>
                    <Text>Sekuriti: {item.sekuriti || "-"}</Text>
                    <Button
                      title="Edit"
                      type="outline"
                      containerStyle={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("FormKejadianCreate", {
                          editData: item,
                        })
                      }
                    />
                  </View>
                </ListItem.Content>
              </ListItem>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flexGrow: 1,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  card: {
    padding: 0,
    margin: 0,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 4,
    fontSize: 16,
  },
  loadingText: {
    textAlign: "center",
    padding: 16,
  },
  titleContainer: {
    flexDirection: "column",
    marginBottom: 6,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  dateTimeContainer: {
    marginTop: 4,
  },
  dateTime: {
    fontSize: 14,
    color: "#666",
  },
  expandedContent: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  previewContent: {
    marginTop: 4,
  },
  dataRow: {
    flexDirection: "row",
    marginVertical: 3,
  },
  label: {
    width: 80,
    fontWeight: "bold",
    color: "#555",
  },
  value: {
    flex: 1,
  },
  actionButton: {
    marginTop: 8,
  },
});

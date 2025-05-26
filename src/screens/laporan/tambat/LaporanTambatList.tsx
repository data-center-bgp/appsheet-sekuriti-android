import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Text, Card, Button, ListItem } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function LaporanTambatList({ navigation }: { navigation: any }) {
  const [laporanTambat, setLaporanTambat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLaporanTambat();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLaporanTambat();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchLaporanTambat() {
    try {
      setLoading(true);
      let { data: laporan_tambat, error } = await supabase
        .from("laporan_tambat")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (laporan_tambat) {
        console.log("Fetched laporan tambat:", laporan_tambat);
        setLaporanTambat(laporanTambat);
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching laporan tambat:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    fetchLaporanTambat();
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
          <Text h4>Daftar Laporan Tambat</Text>
          <Button
            title="Tambah Baru"
            onPress={() => navigation.navigate("LaporanTambatCreate")}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : laporanTambat.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.errorText}>
              Belum ada data yang dimasukkan!
            </Text>
          </Card>
        ) : (
          <Card containerStyle={styles.card}>
            {laporanTambat.map((item) => (
              <ListItem key={item.id} bottomDivider>
                <ListItem.Content>
                  <View style={styles.previewContent}>
                    <Text>ID: {item.ID || "-"}</Text>
                    <Text>Nama Kapal: {item.nama_kapal || "-"}</Text>
                    <Text>Nama Perusahaan: {item.nama_perusahaan || "-"}</Text>
                    <Text style={styles.dateTime}>
                      Tanggal Mulai Tambat: {item.tanggal_mulai_tambat}
                    </Text>
                    <Text style={styles.dateTime}>
                      Waktu Mulai Tambat: {item.waktu_mulai_tambat}
                    </Text>
                    <Text style={styles.dateTime}>
                      Tanggal Selesai Tambat: {item.tanggal_selesai_tambat}
                    </Text>
                    <Text style={styles.dateTime}>
                      Waktu Selesai Tambat: {item.waktu_selesai_tambat}
                    </Text>
                    <Text>Kegiatan: {item.kegiatan || "-"}</Text>
                    <Text style={styles.dateTime}>
                      Tanggal Mulai Connect: {item.tanggal_mulai_connect}
                    </Text>
                    <Text style={styles.dateTime}>
                      Waktu Mulai Connect: {item.waktu_mulai_connect}
                    </Text>
                    <Text style={styles.dateTime}>
                      Tanggal Selesai Connect: {item.tanggal_selesai_connect}
                    </Text>
                    <Text style={styles.dateTime}>
                      Waktu Selesai Connect: {item.waktu_selesai_connect}
                    </Text>
                    <Text>Lokasi: {item.lokasi || "-"}</Text>
                    <Text>Sekuriti: {item.sekuriti || "-"}</Text>
                    <Button
                      title="Edit"
                      type="outline"
                      containerStyle={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("LaporanTambatCreate", {
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

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

export default function LaporanBunkerFreshWaterList({
  navigation,
}: {
  navigation: any;
}) {
  const [laporanBunkerFreshWater, setLaporanBunkerFreshWater] = useState<any[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLaporanBunkerFreshWater();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLaporanBunkerFreshWater();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchLaporanBunkerFreshWater() {
    try {
      setLoading(true);
      let { data: laporan_bunker_fresh_water, error } = await supabase
        .from("laporan_bunker_fresh_water")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (laporan_bunker_fresh_water) {
        console.log(
          "Fetched laporan bunker/fresh water:",
          laporan_bunker_fresh_water
        );
        setLaporanBunkerFreshWater(laporan_bunker_fresh_water);
      }
    } catch (error: any) {
      setError(error.message);
      console.error(
        "Error fetching laporan bunker/fresh water:",
        error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    fetchLaporanBunkerFreshWater();
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
          <Text h4>Daftar Laporan Bunker/Fresh Water</Text>
          <Button
            title="Tambah Baru"
            onPress={() => navigation.navigate("LaporanBunkerFreshWaterCreate")}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : laporanBunkerFreshWater.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.errorText}>
              Belum ada data yang dimasukkan!
            </Text>
          </Card>
        ) : (
          <Card containerStyle={styles.card}>
            {laporanBunkerFreshWater.map((item) => (
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
                    <Text>Nama Pengirim: {item.nama_pengirim || "-"}</Text>
                    <Text>Nama Penerima: {item.nama_penerima || "-"}</Text>
                    <Text>Jenis Surat: {item.jenis_surat || "-"}</Text>
                    <Text>Kurir: {item.kurir || "-"}</Text>
                    <Text>Tujuan: {item.tujuan || "-"}</Text>
                    <Text>Keterangan: {item.keterangan || "-"}</Text>
                    <Text>Sekuriti: {item.sekuriti || "-"}</Text>
                    <Text>Pos: {item.pos || "-"}</Text>
                    <Button
                      title="Edit"
                      type="outline"
                      containerStyle={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("LaporanBunkerFreshWaterCreate", {
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

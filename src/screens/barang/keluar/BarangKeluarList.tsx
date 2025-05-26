import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Text, Card, Button, ListItem, Icon } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function BarangKeluarList({ navigation }: { navigation: any }) {
  const [barangKeluar, setBarangKeluar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBarangKeluar();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBarangKeluar();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchBarangKeluar() {
    try {
      setLoading(true);
      let { data: barang_keluar, error } = await supabase
        .from("barang_keluar")
        .select(
          "id, ID, nomor_do, tanggal, jam, kurir, nama_pemilik_barang, tujuan, keterangan, sekuriti, pos, file_pdf"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (barang_keluar) {
        console.log("Fetched barang keluar:", barang_keluar);
        setBarangKeluar(barang_keluar);
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching barang keluar:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    fetchBarangKeluar();
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
          <Text h4>Daftar Barang Masuk</Text>
          <Button
            title="Tambah Baru"
            onPress={() => navigation.navigate("BarangMasukCreate")}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : barangKeluar.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.errorText}>
              Belum ada data yang dimasukkan!
            </Text>
          </Card>
        ) : (
          <Card containerStyle={styles.card}>
            {barangKeluar.map((item) => (
              <ListItem key={item.id} bottomDivider>
                <ListItem.Content>
                  <View style={styles.titleContainer}>
                    <ListItem.Title style={styles.title}>
                      {item.nomor_do || "No DO"}
                    </ListItem.Title>
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.dateTime}>
                        {item.tanggal || "-"} | {item.jam || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewContent}>
                    <Text>ID: {item.ID || "-"}</Text>
                    <Text>Nomor DO: {item.nomor_do || "-"}</Text>
                    <Text>Pembawa: {item.kurir || "-"}</Text>
                    <Text>Pemilik: {item.nama_pemilik_barang || "-"}</Text>
                    <Text>Tujuan: {item.tujuan || "-"}</Text>
                    <Text>Keterangan: {item.keterangan || "-"}</Text>
                    <Text>Sekuriti: {item.sekuriti || "-"}</Text>
                    <Text>Pos: {item.pos || "-"}</Text>
                    <Text>PDF: {item.file_pdf ? "Tersedia" : "Tidak ada"}</Text>
                    <Button
                      title="Edit"
                      type="outline"
                      containerStyle={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("BarangMasukCreate", {
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

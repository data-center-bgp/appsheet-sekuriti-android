import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, ListItem } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function BarangMasukList({ navigation }: { navigation: any }) {
  const [barangMasuk, setBarangMasuk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBarangMasuk();
  }, []);

  async function fetchBarangMasuk() {
    try {
      setLoading(true);
      let { data: barang_masuk, error } = await supabase
        .from("barang_masuk")
        .select("*");

      if (error) throw error;
      if (barang_masuk) setBarangMasuk(barang_masuk);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text h4>Daftar Barang Masuk</Text>
          <Button
            title="Tambah Baru"
            onPress={() => navigation.navigate("BarangMasukCreate")}
          />
        </View>

        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Card containerStyle={styles.card}>
            {barangMasuk.map((item, index) => (
              <ListItem key={index} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{item.nama_barang}</ListItem.Title>
                  <ListItem.Subtitle>Jumlah: {item.jumlah}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
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
  },
});

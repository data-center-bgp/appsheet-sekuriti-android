import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text, Button, ListItem, Icon, Badge, SearchBar } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const { width } = Dimensions.get("window");

export default function BarangMasukList({ navigation }: { navigation: any }) {
  const [barangMasuk, setBarangMasuk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBarangMasuk();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBarangMasuk();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchBarangMasuk() {
    try {
      setLoading(true);
      let { data: barang_masuk, error } = await supabase
        .from("barang_masuk")
        .select(
          "id, ID, nomor_do, tanggal, jam, nama_pembawa_barang, nama_pemilik_barang, keterangan, sekuriti, pos, file_pdf"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (barang_masuk) {
        setBarangMasuk(barang_masuk);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    fetchBarangMasuk();
  };

  const filteredData = barangMasuk.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.ID && item.ID.toLowerCase().includes(query)) ||
      (item.nomor_do && item.nomor_do.toLowerCase().includes(query)) ||
      (item.nama_pembawa_barang &&
        item.nama_pembawa_barang.toLowerCase().includes(query)) ||
      (item.nama_pemilik_barang &&
        item.nama_pemilik_barang.toLowerCase().includes(query))
    );
  });

  const renderItem = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      onPress={() =>
        navigation.navigate("BarangMasukCreate", { editData: item })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardContainer}>
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.doNumber}>{item.nomor_do || "No DO"}</Text>
            <View style={styles.idContainer}>
              <Icon name="tag" type="feather" size={12} color="#6c757d" />
              <Text style={styles.idText}>ID: {item.ID || "-"}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{item.tanggal || "-"}</Text>
            <Text style={styles.timeText}>{item.jam || "-"}</Text>
            {item.file_pdf && (
              <Badge
                value="PDF"
                status="success"
                containerStyle={styles.pdfBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="user" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pembawa</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.nama_pembawa_barang || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="briefcase" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pemilik</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.nama_pemilik_barang || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="shield" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Sekuriti</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.sekuriti || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="map-pin" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pos</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.pos || "-"}
            </Text>
          </View>

          {item.keterangan && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Keterangan:</Text>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.keterangan}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.editButton}>
            <Icon name="edit-3" type="feather" size={16} color="#007bff" />
            <Text style={styles.editText}>Tap to edit</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barang Masuk</Text>
        <Text style={styles.headerSubtitle}>
          {filteredData.length} {filteredData.length === 1 ? "item" : "items"}
        </Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Cari berdasarkan ID, DO, nama..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
        searchIcon={{ size: 20 }}
        clearIcon={{ size: 20 }}
        round
        lightTheme
      />

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title="Tambah Data Baru"
          onPress={() => navigation.navigate("BarangMasukCreate")}
          buttonStyle={styles.addButton}
          titleStyle={styles.addButtonText}
          icon={{
            name: "plus",
            type: "feather",
            color: "white",
            size: 18,
          }}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Icon
              name="alert-circle"
              type="feather"
              size={48}
              color="#dc3545"
            />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Coba Lagi"
              onPress={fetchBarangMasuk}
              buttonStyle={styles.retryButton}
              type="outline"
            />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="inbox" type="feather" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada data"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Tambahkan data barang masuk pertama Anda"}
            </Text>
            {!searchQuery && (
              <Button
                title="Tambah Data"
                onPress={() => navigation.navigate("BarangMasukCreate")}
                buttonStyle={styles.emptyButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredData.map((item, index) => renderItem(item, index))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    backgroundColor: "white",
    height: 44,
  },
  searchInput: {
    fontSize: 16,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    height: 48,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContainer: {
    paddingTop: 8,
  },
  itemCard: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
  },
  cardContainer: {
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  headerLeft: {
    flex: 1,
  },
  doNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  idText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  timeText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  pdfBadge: {
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  cardContent: {
    padding: 16,
    backgroundColor: "white",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
  },
  infoLabel: {
    fontSize: 12,
    color: "#495057",
    marginLeft: 6,
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#212529",
    marginLeft: 12,
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#212529",
    lineHeight: 20,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    fontSize: 12,
    color: "#007bff",
    marginLeft: 6,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    borderColor: "#dc3545",
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#495057",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: "#007bff",
    marginTop: 20,
    paddingHorizontal: 32,
  },
});

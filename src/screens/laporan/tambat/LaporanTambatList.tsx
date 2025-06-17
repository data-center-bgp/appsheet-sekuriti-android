import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Text, Button, Icon, Badge, SearchBar, Card } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface LaporanTambatItem {
  id: string;
  ID: string;
  nama_kapal: string;
  nama_perusahaan: string;
  tanggal_mulai_tambat: string;
  waktu_mulai_tambat: string;
  tanggal_selesai_tambat: string;
  waktu_selesai_tambat: string;
  kegiatan: string;
  tanggal_mulai_connect: string;
  waktu_mulai_connect: string;
  tanggal_selesai_connect: string;
  waktu_selesai_connect: string;
  lokasi: string;
  sekuriti: string;
  business_unit?: string;
  created_at: string;
}

export default function LaporanTambatList({ navigation }: { navigation: any }) {
  const [laporanTambat, setLaporanTambat] = useState<LaporanTambatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
      setError(null);

      let { data: laporan_tambat, error } = await supabase
        .from("laporan_tambat")
        .select(
          `
          id, ID, nama_kapal, nama_perusahaan, tanggal_mulai_tambat,
          waktu_mulai_tambat, tanggal_selesai_tambat, waktu_selesai_tambat,
          kegiatan, tanggal_mulai_connect, waktu_mulai_connect,
          tanggal_selesai_connect, waktu_selesai_connect, lokasi, sekuriti,
          business_unit, created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (laporan_tambat) {
        setLaporanTambat(laporan_tambat);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLaporanTambat();
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const deleteItem = async (item: LaporanTambatItem) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus laporan "${item.ID}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // Delete main record
              const { error } = await supabase
                .from("laporan_tambat")
                .delete()
                .eq("id", item.id);

              if (error) throw error;

              await fetchLaporanTambat();

              Alert.alert("Berhasil", "Data berhasil dihapus");
            } catch (error: any) {
              console.error("Delete error:", error);
              Alert.alert("Error", `Gagal menghapus data: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredData = laporanTambat.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.ID && item.ID.toLowerCase().includes(query)) ||
      (item.nama_kapal && item.nama_kapal.toLowerCase().includes(query)) ||
      (item.nama_perusahaan &&
        item.nama_perusahaan.toLowerCase().includes(query)) ||
      (item.kegiatan && item.kegiatan.toLowerCase().includes(query)) ||
      (item.lokasi && item.lokasi.toLowerCase().includes(query)) ||
      (item.sekuriti && item.sekuriti.toLowerCase().includes(query)) ||
      (item.business_unit && item.business_unit.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // Show only HH:MM
  };

  const renderItem = (item: LaporanTambatItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <Card
        key={item.id}
        containerStyle={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.idNumber}>{item.ID || "No ID"}</Text>
            <View style={styles.vesselTypeContainer}>
              <Icon name="anchor" type="feather" size={12} color="#6c757d" />
              <Text style={styles.vesselTypeText}>
                {item.nama_kapal || "-"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>
              {formatDate(item.tanggal_mulai_tambat)}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(item.waktu_mulai_tambat)} -{" "}
              {formatTime(item.waktu_selesai_tambat)}
            </Text>
            {item.business_unit && (
              <Badge
                value={item.business_unit}
                status="warning"
                containerStyle={styles.businessUnitBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="anchor" type="feather" size={16} color="#6f42c1" />
            <Text style={styles.statText}>Laporan Tambat</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="briefcase" type="feather" size={16} color="#17a2b8" />
            <Text style={styles.statText}>
              {item.nama_perusahaan || "No Company"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleExpanded(item.id)}
          >
            <Icon
              name={isExpanded ? "chevron-up" : "chevron-down"}
              type="feather"
              size={16}
              color="#6c757d"
            />
            <Text style={styles.expandText}>
              {isExpanded ? "Sembunyikan" : "Detail"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="anchor" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Kapal</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.nama_kapal || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="briefcase" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Perusahaan</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.nama_perusahaan || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="map-pin" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Lokasi</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.lokasi || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="activity" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Kegiatan</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.kegiatan || "-"}
            </Text>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />

              <View style={styles.metadataContainer}>
                <Text style={styles.metadataTitle}>Informasi Tambahan:</Text>
                <Text style={styles.metadataText}>
                  Dibuat: {formatDate(item.created_at)}
                </Text>
                <Text style={styles.metadataText}>
                  Tanggal Mulai Tambat: {formatDate(item.tanggal_mulai_tambat)}
                </Text>
                <Text style={styles.metadataText}>
                  Waktu Mulai Tambat: {formatTime(item.waktu_mulai_tambat)}
                </Text>
                <Text style={styles.metadataText}>
                  Tanggal Selesai Tambat:{" "}
                  {formatDate(item.tanggal_selesai_tambat)}
                </Text>
                <Text style={styles.metadataText}>
                  Waktu Selesai Tambat: {formatTime(item.waktu_selesai_tambat)}
                </Text>
                <Text style={styles.metadataText}>
                  Tanggal Mulai Connect:{" "}
                  {formatDate(item.tanggal_mulai_connect)}
                </Text>
                <Text style={styles.metadataText}>
                  Waktu Mulai Connect: {formatTime(item.waktu_mulai_connect)}
                </Text>
                <Text style={styles.metadataText}>
                  Tanggal Selesai Connect:{" "}
                  {formatDate(item.tanggal_selesai_connect)}
                </Text>
                <Text style={styles.metadataText}>
                  Waktu Selesai Connect:{" "}
                  {formatTime(item.waktu_selesai_connect)}
                </Text>
                <Text style={styles.metadataText}>
                  Sekuriti: {item.sekuriti || "-"}
                </Text>
                {item.business_unit && (
                  <Text style={styles.metadataText}>
                    Business Unit: {item.business_unit}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("LaporanTambatCreate", {
                editData: item,
              })
            }
          >
            <Icon name="edit-3" type="feather" size={16} color="#6f42c1" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteItem(item)}
          >
            <Icon name="trash-2" type="feather" size={16} color="#dc3545" />
            <Text style={[styles.actionButtonText, { color: "#dc3545" }]}>
              Hapus
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Tambat</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSubtitle}>
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "report" : "reports"}
          </Text>
          <View style={styles.totalStats}>
            <Icon name="anchor" type="feather" size={12} color="#6f42c1" />
            <Text style={styles.totalStatsText}>
              {filteredData.length} total reports
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Cari berdasarkan ID, kapal, perusahaan, kegiatan..."
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
          title="Tambah Laporan Baru"
          onPress={() => navigation.navigate("LaporanTambatCreate")}
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
            <Icon name="loader" type="feather" size={32} color="#6f42c1" />
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
              onPress={fetchLaporanTambat}
              buttonStyle={styles.retryButton}
              type="outline"
            />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="anchor" type="feather" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada data"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Tambahkan laporan tambat pertama Anda"}
            </Text>
            {!searchQuery && (
              <Button
                title="Tambah Laporan"
                onPress={() => navigation.navigate("LaporanTambatCreate")}
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
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  totalStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalStatsText: {
    fontSize: 12,
    color: "#6f42c1",
    fontWeight: "500",
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
    backgroundColor: "#6f42c1",
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
    borderWidth: 0,
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#e2d9f3",
  },
  headerLeft: {
    flex: 1,
  },
  idNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  vesselTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  vesselTypeText: {
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
  businessUnitBadge: {
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#e2d9f3",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#dee2e6",
    marginHorizontal: 12,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  expandText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
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
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 16,
  },
  metadataContainer: {
    padding: 12,
    backgroundColor: "#e2d9f3",
    borderRadius: 6,
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#e2d9f3",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#6f42c1",
    fontWeight: "500",
  },
  actionDivider: {
    width: 1,
    backgroundColor: "#e9ecef",
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
    backgroundColor: "#6f42c1",
    marginTop: 20,
    paddingHorizontal: 32,
  },
});

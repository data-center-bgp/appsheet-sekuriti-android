import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Icon, Badge, SearchBar, Card } from "@rneui/themed";
import { supabase } from "../../../lib/supabase";
import { useDataFilter } from "../../../hooks/useDataFilter";
import DateFilter, { DateFilterState } from "../../../components/DateFilter";
import {
  applyDateFilter,
  getDateFilterSummary,
} from "../../../utils/dateFilter";
import {
  groupChecksBySession,
  formatTravoLabel,
  CheckRecord,
  ChecklistSession,
} from "../../../utils/travoBlowerChecklist";

const MAX_ROWS = 500;

export default function LaporanTravoBlowerList({
  navigation,
}: {
  navigation: any;
}) {
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    startDate: null,
    endDate: null,
    isActive: false,
  });

  const { dataFilter, canSeeAllData, loading: filterLoading } = useDataFilter();

  useEffect(() => {
    if (!filterLoading) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFilter, filterLoading, dateFilter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!filterLoading) fetchData();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, filterLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("travo_blower_checks")
        .select(
          `id, master_travo_blower_id, kondisi, keterangan, tanggal, jam,
           sekuriti, created_at,
           master_travo_blower!inner(jenis, business_unit, pemilik, nomor_unit)`
        )
        .order("created_at", { ascending: false })
        .limit(MAX_ROWS);

      // Filter BU pada kolom embedded master (non-master saja).
      // profiles.business_unit HURUF BESAR, master_travo_blower lowercase —
      // lowercase-kan nilai filter agar cocok (lihat useSecurityNames).
      if (!canSeeAllData && dataFilter) {
        query = query.eq(
          "master_travo_blower.business_unit",
          dataFilter.toLowerCase()
        );
      }

      query = applyDateFilter(query, dateFilter, "tanggal");

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const records = (data || []) as unknown as CheckRecord[];
      setSessions(groupChecksBySession(records));
    } catch (err) {
      console.error("Error fetching travo_blower_checks:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const deleteSession = (session: ChecklistSession) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Hapus checklist ${formatDate(session.tanggal)} ${formatTime(
        session.jam
      )} oleh ${session.sekuriti}? (${session.items.length} item)`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const ids = session.items.map((i) => i.id);
              const { error: delError } = await supabase
                .from("travo_blower_checks")
                .delete()
                .in("id", ids);
              if (delError) throw delError;
              await fetchData();
              Alert.alert("Berhasil", "Checklist berhasil dihapus");
            } catch (e: any) {
              Alert.alert("Error", `Gagal menghapus: ${e.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) =>
    !timeString ? "-" : timeString.substring(0, 5);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (s.sekuriti.toLowerCase().includes(q)) return true;
    return s.items.some(
      (i) =>
        (i.master_travo_blower?.jenis || "").toLowerCase().includes(q) ||
        i.kondisi.toLowerCase().includes(q) ||
        (i.keterangan || "").toLowerCase().includes(q)
    );
  });

  const renderSession = (s: ChecklistSession, index: number) => {
    const isExpanded = expanded.has(s.key);
    return (
      <Card
        key={s.key}
        containerStyle={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.idNumber}>{s.sekuriti || "-"}</Text>
            <View style={styles.rowCenter}>
              <Icon name="check-square" type="feather" size={12} color="#6c757d" />
              <Text style={styles.subText}>{s.items.length} item</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{formatDate(s.tanggal)}</Text>
            <Text style={styles.timeText}>{formatTime(s.jam)}</Text>
            {s.business_unit && (
              <Badge
                value={s.business_unit}
                status="warning"
                containerStyle={styles.businessUnitBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="zap" type="feather" size={16} color="#20c997" />
            <Text style={styles.statText}>{s.nyalaCount} Nyala</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="zap-off" type="feather" size={16} color="#dc3545" />
            <Text style={styles.statText}>{s.matiCount} Mati</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.expandButton} onPress={() => toggle(s.key)}>
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

        {isExpanded && (
          <View style={styles.cardContent}>
            {s.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Text style={styles.itemName}>
                    {it.master_travo_blower
                      ? formatTravoLabel(it.master_travo_blower)
                      : "-"}
                  </Text>
                  {it.keterangan ? (
                    <Text style={styles.itemNote}>{it.keterangan}</Text>
                  ) : null}
                </View>
                <Badge
                  value={it.kondisi}
                  badgeStyle={{
                    backgroundColor:
                      it.kondisi === "Mati" ? "#dc3545" : "#20c997",
                  }}
                  textStyle={styles.badgeText}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteSession(s)}
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

  if (filterLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#20c997" />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checklist Travo Blower</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSessions.length} sesi checklist
        </Text>
      </View>

      {canSeeAllData && (
        <View style={styles.masterBadge}>
          <Icon name="star" type="feather" size={16} color="#333" />
          <Text style={styles.masterBadgeText}>
            Master View - Semua business unit
          </Text>
        </View>
      )}
      {!canSeeAllData && dataFilter && (
        <View style={styles.filterBadge}>
          <Icon name="filter" type="feather" size={16} color="#1976d2" />
          <Text style={styles.filterBadgeText}>
            Business unit: {dataFilter.toUpperCase()}
          </Text>
        </View>
      )}
      {dateFilter.isActive && (
        <View style={styles.dateFilterBadge}>
          <Icon name="calendar" type="feather" size={16} color="#007bff" />
          <Text style={styles.dateFilterBadgeText}>
            {getDateFilterSummary(dateFilter)}
          </Text>
        </View>
      )}

      <SearchBar
        placeholder="Cari sekuriti, jenis, kondisi, keterangan..."
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

      <DateFilter value={dateFilter} onChange={setDateFilter} themeColor="#007bff" />

      <View style={styles.addButtonContainer}>
        <Button
          title="Buat Checklist Baru"
          onPress={() => navigation.navigate("LaporanTravoBlowerCreate")}
          buttonStyle={styles.addButton}
          titleStyle={styles.addButtonText}
          icon={{ name: "plus", type: "feather", color: "white", size: 18 }}
        />
      </View>

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
            <Icon name="loader" type="feather" size={32} color="#20c997" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Icon name="alert-circle" type="feather" size={48} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Coba Lagi"
              onPress={fetchData}
              buttonStyle={styles.retryButton}
              type="outline"
            />
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="check-square" type="feather" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada checklist"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Buat checklist travo/blower pertama"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredSessions.map((s, i) => renderSession(s, i))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#212529" },
  headerSubtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
  masterBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  masterBadgeText: { color: "#333", fontWeight: "600", fontSize: 14, flex: 1 },
  filterBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterBadgeText: { color: "#1976d2", fontWeight: "500", fontSize: 14, flex: 1 },
  dateFilterBadge: {
    backgroundColor: "#cce5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateFilterBadgeText: { color: "#007bff", fontWeight: "500", fontSize: 14, flex: 1 },
  searchContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: { backgroundColor: "white", height: 44 },
  searchInput: { fontSize: 16 },
  addButtonContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  addButton: { backgroundColor: "#20c997", borderRadius: 8, height: 48 },
  addButtonText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  listContainer: { paddingTop: 8 },
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
    backgroundColor: "#c6f7d6",
  },
  headerLeft: { flex: 1 },
  idNumber: { fontSize: 18, fontWeight: "bold", color: "#212529", marginBottom: 4 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  subText: { fontSize: 12, color: "#6c757d", marginLeft: 4 },
  headerRight: { alignItems: "flex-end" },
  dateText: { fontSize: 14, fontWeight: "600", color: "#495057" },
  timeText: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  businessUnitBadge: { marginTop: 4 },
  badgeText: { fontSize: 10 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#c6f7d6",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: "#495057", fontWeight: "500" },
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
  expandText: { fontSize: 12, color: "#6c757d", fontWeight: "500" },
  cardContent: { padding: 16, backgroundColor: "white" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  itemRowLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, color: "#212529", fontWeight: "500" },
  itemNote: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#c6f7d6",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: { fontSize: 14, color: "#20c997", fontWeight: "500" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: { fontSize: 16, color: "#6c757d", marginTop: 16 },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: { borderColor: "#dc3545", borderWidth: 1 },
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
});

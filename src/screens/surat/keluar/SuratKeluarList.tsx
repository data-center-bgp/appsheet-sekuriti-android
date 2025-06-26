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
import { applyBusinessUnitFilter } from "../../../utils/queryHelper";
import DateFilter, { DateFilterState } from "../../../components/DateFilter";
import {
  applyDateFilter,
  getDateFilterSummary,
} from "../../../utils/dateFilter";

// Pagination constants
const ITEMS_PER_PAGE = 10;

interface SuratKeluarItem {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  nama_pengirim: string;
  nama_penerima: string;
  jenis_surat: string;
  kurir: string;
  tujuan: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit?: string;
  created_at: string;
}

export default function SuratKeluarList({ navigation }: { navigation: any }) {
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    startDate: null,
    endDate: null,
    isActive: false,
  });

  // Get data filter based on user's business unit
  const { dataFilter, canSeeAllData, loading: filterLoading } = useDataFilter();

  useEffect(() => {
    if (!filterLoading) {
      resetPaginationAndFetch();
    }
  }, [dataFilter, filterLoading, searchQuery, dateFilter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!filterLoading) {
        resetPaginationAndFetch();
      }
    });
    return unsubscribe;
  }, [navigation, filterLoading]);

  const resetPaginationAndFetch = () => {
    setCurrentPage(1);
    setSuratKeluar([]);
    fetchData(1, true);
  };

  const fetchData = async (
    page: number = currentPage,
    replace: boolean = false
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Calculate offset for pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Start building the query
      let query = supabase
        .from("surat_keluar")
        .select(
          `
          id, ID, tanggal, jam, nama_pengirim, nama_penerima, jenis_surat,
          kurir, tujuan, keterangan, sekuriti, pos, business_unit, created_at
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      // Apply business unit filter
      query = applyBusinessUnitFilter(query, dataFilter);

      // Apply date filter
      query = applyDateFilter(query, dateFilter, "tanggal");

      // Apply search filter if there's a search query
      if (searchQuery.trim()) {
        query = query.or(
          `ID.ilike.%${searchQuery}%,nama_pengirim.ilike.%${searchQuery}%,nama_penerima.ilike.%${searchQuery}%,jenis_surat.ilike.%${searchQuery}%,kurir.ilike.%${searchQuery}%,tujuan.ilike.%${searchQuery}%,keterangan.ilike.%${searchQuery}%,sekuriti.ilike.%${searchQuery}%,pos.ilike.%${searchQuery}%,business_unit.ilike.%${searchQuery}%`
        );
      }

      const { data: result, error, count } = await query;

      if (error) throw error;

      if (result) {
        // Set total count for pagination
        setTotalItems(count || 0);

        if (replace || page === 1) {
          setSuratKeluar(result);
        } else {
          setSuratKeluar((prev) => [...prev, ...result]);
        }
      }
    } catch (err) {
      console.error("Error fetching surat keluar:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    resetPaginationAndFetch();
  };

  const loadMoreData = () => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (currentPage < totalPages && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchData(nextPage, false);
    }
  };

  const goToPage = (page: number) => {
    if (
      page !== currentPage &&
      page >= 1 &&
      page <= Math.ceil(totalItems / ITEMS_PER_PAGE)
    ) {
      setCurrentPage(page);
      fetchData(page, true);
    }
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

  const deleteItem = async (item: SuratKeluarItem) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus surat "${item.ID}"?`,
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
                .from("surat_keluar")
                .delete()
                .eq("id", item.id);

              if (error) throw error;

              // Refresh current page
              await fetchData(currentPage, true);

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

  // Pagination Component
  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Halaman {currentPage} dari {totalPages} ({totalItems} total item)
          </Text>
        </View>

        <View style={styles.paginationControls}>
          {/* First Page */}
          {currentPage > 1 && (
            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => goToPage(1)}
            >
              <Icon
                name="chevrons-left"
                type="feather"
                size={16}
                color="#dc3545"
              />
            </TouchableOpacity>
          )}

          {/* Previous Page */}
          {currentPage > 1 && (
            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => goToPage(currentPage - 1)}
            >
              <Icon
                name="chevron-left"
                type="feather"
                size={16}
                color="#dc3545"
              />
            </TouchableOpacity>
          )}

          {/* Page Numbers */}
          {pages.map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.pageButton,
                page === currentPage && styles.activePageButton,
              ]}
              onPress={() => goToPage(page)}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  page === currentPage && styles.activePageButtonText,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Next Page */}
          {currentPage < totalPages && (
            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => goToPage(currentPage + 1)}
            >
              <Icon
                name="chevron-right"
                type="feather"
                size={16}
                color="#dc3545"
              />
            </TouchableOpacity>
          )}

          {/* Last Page */}
          {currentPage < totalPages && (
            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => goToPage(totalPages)}
            >
              <Icon
                name="chevrons-right"
                type="feather"
                size={16}
                color="#dc3545"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Load More Button (Alternative to pagination) */}
        {currentPage < totalPages && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreData}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#dc3545" />
            ) : (
              <Icon
                name="chevron-down"
                type="feather"
                size={16}
                color="#dc3545"
              />
            )}
            <Text style={styles.loadMoreText}>
              {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderItem = (item: SuratKeluarItem, index: number) => {
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
            <View style={styles.documentTypeContainer}>
              <Icon name="file-text" type="feather" size={12} color="#6c757d" />
              <Text style={styles.documentTypeText}>
                {item.jenis_surat || "-"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{formatDate(item.tanggal)}</Text>
            <Text style={styles.timeText}>{formatTime(item.jam)}</Text>
            {item.business_unit && (
              <Badge
                value={item.business_unit}
                status="error"
                containerStyle={styles.businessUnitBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="mail" type="feather" size={16} color="#dc3545" />
            <Text style={styles.statText}>Surat Keluar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="truck" type="feather" size={16} color="#28a745" />
            <Text style={styles.statText}>{item.kurir || "No Courier"}</Text>
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
              <Icon name="user" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pengirim</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.nama_pengirim || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon
                name="user-check"
                type="feather"
                size={14}
                color="#495057"
              />
              <Text style={styles.infoLabel}>Penerima</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.nama_penerima || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="truck" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Kurir</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.kurir || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="map-pin" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Tujuan</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.tujuan || "-"}
            </Text>
          </View>

          {item.keterangan && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Keterangan:</Text>
              <Text
                style={styles.descriptionText}
                numberOfLines={isExpanded ? 0 : 2}
              >
                {item.keterangan}
              </Text>
            </View>
          )}

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
                  Tanggal Keluar: {formatDate(item.tanggal)}
                </Text>
                <Text style={styles.metadataText}>
                  Jam: {formatTime(item.jam)}
                </Text>
                <Text style={styles.metadataText}>
                  Jenis Surat: {item.jenis_surat || "-"}
                </Text>
                <Text style={styles.metadataText}>
                  Sekuriti: {item.sekuriti || "-"}
                </Text>
                <Text style={styles.metadataText}>Pos: {item.pos || "-"}</Text>
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
              navigation.navigate("SuratKeluarCreate", { editData: item })
            }
          >
            <Icon name="edit-3" type="feather" size={16} color="#dc3545" />
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

  // Show loading state while determining user permissions
  if (filterLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surat Keluar</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSubtitle}>
            {suratKeluar.length} dari {totalItems}{" "}
            {totalItems === 1 ? "document" : "documents"}
          </Text>
          <View style={styles.totalStats}>
            <Icon name="mail" type="feather" size={12} color="#dc3545" />
            <Text style={styles.totalStatsText}>
              {suratKeluar.length} documents on current page
            </Text>
          </View>
        </View>
      </View>

      {/* Business Unit Filter Status */}
      {canSeeAllData && (
        <View style={styles.masterBadge}>
          <Icon name="star" type="feather" size={16} color="#333" />
          <Text style={styles.masterBadgeText}>
            Master View - Showing all data from all business units
          </Text>
        </View>
      )}

      {!canSeeAllData && dataFilter && (
        <View style={styles.filterBadge}>
          <Icon name="filter" type="feather" size={16} color="#1976d2" />
          <Text style={styles.filterBadgeText}>
            Showing data for: {dataFilter.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Date Filter Status */}
      {dateFilter.isActive && (
        <View style={styles.dateFilterBadge}>
          <Icon name="calendar" type="feather" size={16} color="#007bff" />
          <Text style={styles.dateFilterBadgeText}>
            {getDateFilterSummary(dateFilter)}
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <SearchBar
        placeholder="Cari berdasarkan ID, pengirim, penerima, kurir, tujuan, business unit..."
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

      {/* Date Filter */}
      <DateFilter
        value={dateFilter}
        onChange={setDateFilter}
        themeColor="#007bff"
      />

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title="Tambah Surat Baru"
          onPress={() => navigation.navigate("SuratKeluarCreate")}
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
            <Icon name="loader" type="feather" size={32} color="#dc3545" />
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
              onPress={() => fetchData(currentPage, true)}
              buttonStyle={styles.retryButton}
              type="outline"
            />
          </View>
        ) : suratKeluar.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="mail" type="feather" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada data"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Tambahkan surat keluar pertama Anda"}
            </Text>
            {!searchQuery && (
              <Button
                title="Tambah Surat"
                onPress={() => navigation.navigate("SuratKeluarCreate")}
                buttonStyle={styles.emptyButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {suratKeluar.map((item, index) => renderItem(item, index))}
            {renderPagination()}
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
    color: "#dc3545",
    fontWeight: "500",
  },
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
  masterBadgeText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
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
  filterBadgeText: {
    color: "#1976d2",
    fontWeight: "500",
    fontSize: 14,
    flex: 1,
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
    backgroundColor: "#dc3545",
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
    backgroundColor: "#fff5f5",
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
  documentTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentTypeText: {
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
    backgroundColor: "#fff5f5",
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
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fff5f5",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#dc3545",
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
    backgroundColor: "#fff5f5",
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
    backgroundColor: "#fff5f5",
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
    color: "#dc3545",
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
    backgroundColor: "#dc3545",
    marginTop: 20,
    paddingHorizontal: 32,
  },
  // Pagination Styles
  paginationContainer: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  paginationInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  paginationControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "white",
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  activePageButton: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
  },
  pageButtonText: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "500",
  },
  activePageButtonText: {
    color: "white",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "500",
  },
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
  dateFilterBadgeText: {
    color: "#007bff",
    fontWeight: "500",
    fontSize: 14,
    flex: 1,
  },
});

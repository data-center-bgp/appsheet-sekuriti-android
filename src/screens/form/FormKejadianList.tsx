import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Icon, Badge, SearchBar, Card } from "@rneui/themed";
import { supabase } from "../../lib/supabase";
import { deletePhotoFromStorage } from "../../utils/photoKejadianHandler";
import { useDataFilter } from "../../hooks/useDataFilter";
import { applyBusinessUnitFilter } from "../../utils/queryHelper";
import DateFilter, { DateFilterState } from "../../components/DateFilter";
import { applyDateFilter, getDateFilterSummary } from "../../utils/dateFilter";

const { width, height } = Dimensions.get("window");

// Pagination constants
const ITEMS_PER_PAGE = 10;

interface FormKejadianItem {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  kejadian: string;
  lokasi: string;
  sekuriti: string;
  business_unit: string;
  created_at: string;
  foto_count?: number;
  foto_kejadian?: any[];
}

export default function FormKejadianList({ navigation }: { navigation: any }) {
  const [formKejadian, setFormKejadian] = useState<FormKejadianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get data filter based on user's business unit
  const { dataFilter, canSeeAllData, loading: filterLoading } = useDataFilter();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    startDate: null,
    endDate: null,
    isActive: false,
  });

  // Photo viewer states
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoGallery, setPhotoGallery] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
    setFormKejadian([]);
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
        .from("form_kejadian")
        .select(
          `
          id, ID, tanggal, jam, kejadian, lokasi, sekuriti, business_unit, created_at,
          foto_kejadian(id, foto, storage_path)
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
          `ID.ilike.%${searchQuery}%,kejadian.ilike.%${searchQuery}%,lokasi.ilike.%${searchQuery}%,sekuriti.ilike.%${searchQuery}%,business_unit.ilike.%${searchQuery}%`
        );
      }

      const { data: result, error, count } = await query;

      if (error) {
        throw error;
      }

      if (result) {
        // Set total count for pagination
        setTotalItems(count || 0);

        // Add counts to each item
        const itemsWithCounts = result.map((item) => ({
          ...item,
          foto_count: item.foto_kejadian?.length || 0,
        }));

        if (replace || page === 1) {
          setFormKejadian(itemsWithCounts);
        } else {
          setFormKejadian((prev) => [...prev, ...itemsWithCounts]);
        }
      }
    } catch (err) {
      console.error("Error fetching form kejadian:", err);
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

  const openPhotoGallery = (photos: any[], startIndex: number = 0) => {
    setPhotoGallery(photos);
    setCurrentPhotoIndex(startIndex);
    setSelectedPhoto(photos[startIndex]?.foto);
    setPhotoModalVisible(true);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    let newIndex = currentPhotoIndex;
    if (direction === "prev" && currentPhotoIndex > 0) {
      newIndex = currentPhotoIndex - 1;
    } else if (
      direction === "next" &&
      currentPhotoIndex < photoGallery.length - 1
    ) {
      newIndex = currentPhotoIndex + 1;
    }

    setCurrentPhotoIndex(newIndex);
    setSelectedPhoto(photoGallery[newIndex]?.foto);
  };

  const closePhotoModal = () => {
    setPhotoModalVisible(false);
    setSelectedPhoto(null);
    setPhotoGallery([]);
    setCurrentPhotoIndex(0);
  };

  const deleteItem = async (item: FormKejadianItem) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus laporan kejadian "${item.ID}"?\n\nIni akan menghapus semua foto yang terkait.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // First, delete photos from Supabase Storage
              if (item.foto_kejadian && item.foto_kejadian.length > 0) {
                const deletePhotoPromises = item.foto_kejadian.map(
                  async (foto) => {
                    if (foto.storage_path) {
                      const result = await deletePhotoFromStorage(
                        foto.storage_path
                      );
                      if (!result.success) {
                        console.warn(
                          `Failed to delete photo from storage: ${foto.storage_path}`
                        );
                      }
                    }
                  }
                );

                await Promise.all(deletePhotoPromises);
              }

              // Delete related photos from database
              await supabase
                .from("foto_kejadian")
                .delete()
                .eq("form_kejadian_id", item.id);

              // Delete main record
              const { error } = await supabase
                .from("form_kejadian")
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

  const deletePhoto = async (
    photoId: string,
    storagePath: string,
    formKejadianId: string
  ) => {
    Alert.alert("Hapus Foto", "Apakah Anda yakin ingin menghapus foto ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            // Delete from storage
            if (storagePath) {
              const result = await deletePhotoFromStorage(storagePath);
              if (!result.success) {
                console.warn(
                  `Failed to delete photo from storage: ${storagePath}`
                );
              }
            }

            // Delete from database
            const { error } = await supabase
              .from("foto_kejadian")
              .delete()
              .eq("id", photoId);

            if (error) throw error;

            // Refresh the current page
            await fetchData(currentPage, true);

            // Close modal if this was the current photo
            if (photoGallery.length <= 1) {
              closePhotoModal();
            } else {
              // Update photo gallery and adjust current index
              const updatedGallery = photoGallery.filter(
                (photo) => photo.id !== photoId
              );
              setPhotoGallery(updatedGallery);

              if (currentPhotoIndex >= updatedGallery.length) {
                setCurrentPhotoIndex(updatedGallery.length - 1);
                setSelectedPhoto(
                  updatedGallery[updatedGallery.length - 1]?.foto
                );
              } else {
                setSelectedPhoto(updatedGallery[currentPhotoIndex]?.foto);
              }
            }

            Alert.alert("Berhasil", "Foto berhasil dihapus");
          } catch (error: any) {
            console.error("Delete photo error:", error);
            Alert.alert("Error", `Gagal menghapus foto: ${error.message}`);
          }
        },
      },
    ]);
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

  const renderPhotoGallery = (item: FormKejadianItem) => {
    if (!item.foto_kejadian || item.foto_kejadian.length === 0) {
      return (
        <View style={styles.noPhotoContainer}>
          <Text style={styles.noPhotoText}>Tidak ada foto dokumentasi</Text>
        </View>
      );
    }

    return (
      <View style={styles.photoGalleryContainer}>
        <Text style={styles.detailSectionTitle}>Foto Dokumentasi:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photoGrid}>
            {item.foto_kejadian.map((foto, index) => (
              <TouchableOpacity
                key={foto.id || index}
                style={styles.photoThumbnail}
                onPress={() => openPhotoGallery(item.foto_kejadian!, index)}
              >
                <Image
                  source={{ uri: foto.foto }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.warn("Image load error:", error.nativeEvent.error);
                  }}
                />
                <View style={styles.thumbnailOverlay}>
                  <Icon name="eye" type="feather" size={16} color="white" />
                </View>
                {/* Storage indicator */}
                <View style={styles.storageBadge}>
                  <Icon name="cloud" type="feather" size={8} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.photoCount}>
          {item.foto_kejadian.length} foto tersimpan di cloud storage
        </Text>
      </View>
    );
  };

  const renderPhotoModal = () => {
    if (!selectedPhoto || !photoModalVisible) return null;

    const currentPhoto = photoGallery[currentPhotoIndex];

    return (
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Foto Dokumentasi Kejadian</Text>
                <Text style={styles.modalSubtitle}>
                  {currentPhotoIndex + 1} dari {photoGallery.length}
                </Text>
              </View>
              <View style={styles.modalHeaderRight}>
                {/* Delete Photo Button */}
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => {
                    if (currentPhoto?.id && currentPhoto?.storage_path) {
                      // Find the parent item to get form_kejadian_id
                      const parentItem = formKejadian.find((item) =>
                        item.foto_kejadian?.some(
                          (foto) => foto.id === currentPhoto.id
                        )
                      );
                      if (parentItem) {
                        deletePhoto(
                          currentPhoto.id,
                          currentPhoto.storage_path,
                          parentItem.id
                        );
                      }
                    }
                  }}
                >
                  <Icon name="trash-2" type="feather" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closePhotoModal}
                >
                  <Icon name="x" type="feather" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Photo Display */}
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullImage}
                resizeMode="contain"
                onError={(error) => {
                  console.warn(
                    "Full image load error:",
                    error.nativeEvent.error
                  );
                  Alert.alert(
                    "Error",
                    "Gagal memuat foto. Foto mungkin telah dihapus dari storage."
                  );
                }}
              />

              {/* Navigation Buttons */}
              {photoGallery.length > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={() => navigatePhoto("prev")}
                    >
                      <Icon
                        name="chevron-left"
                        type="feather"
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                  )}

                  {currentPhotoIndex < photoGallery.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => navigatePhoto("next")}
                    >
                      <Icon
                        name="chevron-right"
                        type="feather"
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Photo Info */}
            <View style={styles.photoInfo}>
              {currentPhoto?.storage_path && (
                <View style={styles.photoInfoItem}>
                  <Icon name="cloud" type="feather" size={16} color="#ccc" />
                  <Text style={styles.photoInfoText}>
                    Tersimpan di cloud storage
                  </Text>
                </View>
              )}
            </View>

            {/* Thumbnail Strip */}
            {photoGallery.length > 1 && (
              <View style={styles.thumbnailStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {photoGallery.map((foto, index) => (
                    <TouchableOpacity
                      key={foto.id || index}
                      style={[
                        styles.miniThumbnail,
                        index === currentPhotoIndex && styles.activeThumbnail,
                      ]}
                      onPress={() => {
                        setCurrentPhotoIndex(index);
                        setSelectedPhoto(foto.foto);
                      }}
                    >
                      <Image
                        source={{ uri: foto.foto }}
                        style={styles.miniThumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
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

  const renderItem = (item: FormKejadianItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <Card
        key={item.id}
        containerStyle={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.incidentId}>{item.ID || "No ID"}</Text>
            <View style={styles.idContainer}>
              <Icon
                name="alert-triangle"
                type="feather"
                size={12}
                color="#6c757d"
              />
              <Text style={styles.idText}>Laporan Kejadian</Text>
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
            <Icon
              name="alert-triangle"
              type="feather"
              size={16}
              color="#dc3545"
            />
            <Text style={styles.statText}>Kejadian</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => {
              if (item.foto_kejadian && item.foto_kejadian.length > 0) {
                openPhotoGallery(item.foto_kejadian);
              }
            }}
            disabled={!item.foto_count}
          >
            <Icon
              name="camera"
              type="feather"
              size={16}
              color={item.foto_count ? "#28a745" : "#6c757d"}
            />
            <Text
              style={[
                styles.statText,
                { color: item.foto_count ? "#28a745" : "#6c757d" },
              ]}
            >
              {item.foto_count} Foto
            </Text>
            {(item.foto_count ?? 0) > 0 && (
              <Icon
                name="cloud"
                type="feather"
                size={10}
                color="#28a745"
                containerStyle={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
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
              <Icon
                name="alert-triangle"
                type="feather"
                size={14}
                color="#495057"
              />
              <Text style={styles.infoLabel}>Kejadian</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 2}>
              {item.kejadian || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="map-pin" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Lokasi</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.lokasi || "-"}
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

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              {renderPhotoGallery(item)}

              <View style={styles.metadataContainer}>
                <Text style={styles.metadataTitle}>Informasi Tambahan:</Text>
                <Text style={styles.metadataText}>
                  Dibuat: {formatDate(item.created_at)}
                </Text>
                <Text style={styles.metadataText}>
                  Tanggal Kejadian: {formatDate(item.tanggal)}
                </Text>
                <Text style={styles.metadataText}>
                  Jam Kejadian: {formatTime(item.jam)}
                </Text>
                {item.business_unit && (
                  <Text style={styles.metadataText}>
                    Business Unit: {item.business_unit}
                  </Text>
                )}
                {(item.foto_count ?? 0) > 0 && (
                  <Text style={styles.metadataText}>
                    Foto tersimpan di Supabase Storage
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
              navigation.navigate("FormKejadianCreate", { editData: item })
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
        <Text style={styles.headerTitle}>Laporan Kejadian</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSubtitle}>
            {formKejadian.length} dari {totalItems}{" "}
            {totalItems === 1 ? "report" : "reports"}
          </Text>
          <View style={styles.totalStats}>
            <Icon
              name="alert-triangle"
              type="feather"
              size={12}
              color="#dc3545"
            />
            <Text style={styles.totalStatsText}>
              {formKejadian.reduce(
                (sum, item) => sum + (item.foto_count || 0),
                0
              )}{" "}
              total photos
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
        placeholder="Cari berdasarkan ID, kejadian, lokasi, sekuriti, business unit..."
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
          title="Tambah Laporan Baru"
          onPress={() => navigation.navigate("FormKejadianCreate")}
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
        ) : formKejadian.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon
              name="alert-triangle"
              type="feather"
              size={64}
              color="#6c757d"
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada data"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Tambahkan laporan kejadian pertama Anda"}
            </Text>
            {!searchQuery && (
              <Button
                title="Tambah Laporan"
                onPress={() => navigation.navigate("FormKejadianCreate")}
                buttonStyle={styles.emptyButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {formKejadian.map((item, index) => renderItem(item, index))}
            {renderPagination()}
          </View>
        )}
      </ScrollView>

      {/* Photo Modal */}
      {renderPhotoModal()}
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
    backgroundColor: "#f8d7da",
  },
  headerLeft: {
    flex: 1,
  },
  incidentId: {
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
    backgroundColor: "#f8d7da",
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
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  // Photo Gallery Styles
  photoGalleryContainer: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  photoThumbnail: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  storageBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(40, 167, 69, 0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCount: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
  },
  noPhotoContainer: {
    padding: 16,
    alignItems: "center",
  },
  noPhotoText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 2,
  },
  deletePhotoButton: {
    padding: 8,
    backgroundColor: "rgba(220, 53, 69, 0.8)",
    borderRadius: 20,
  },
  closeButton: {
    padding: 8,
  },
  photoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullImage: {
    width: width,
    height: height * 0.6,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  photoInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  photoInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  photoInfoText: {
    color: "white",
    fontSize: 14,
  },
  thumbnailStrip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  miniThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeThumbnail: {
    borderColor: "#dc3545",
  },
  miniThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  metadataContainer: {
    padding: 12,
    backgroundColor: "#f8d7da",
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
    backgroundColor: "#f8d7da",
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

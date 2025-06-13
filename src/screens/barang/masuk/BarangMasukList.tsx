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
} from "react-native";
import { Text, Button, Icon, Badge, SearchBar, Card } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { deletePhotoFromStorage } from "../../../utils/photoDoMasukHandler";

const { width, height } = Dimensions.get("window");

interface BarangMasukItem {
  id: string;
  ID: string;
  nomor_do: string;
  tanggal: string;
  jam: string;
  nama_pembawa_barang: string;
  nama_pemilik_barang: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit: string;
  created_at: string;
  detail_count?: number;
  foto_count?: number;
  detail_do_masuk?: any[];
  foto_do_masuk?: any[];
}

export default function BarangMasukList({ navigation }: { navigation: any }) {
  const [barangMasuk, setBarangMasuk] = useState<BarangMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Photo viewer states
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoGallery, setPhotoGallery] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
      setError(null);

      // Fetch main data with related data including storage_path
      let { data: barang_masuk, error } = await supabase
        .from("barang_masuk")
        .select(
          `
          id, ID, nomor_do, tanggal, jam, nama_pembawa_barang, nama_pemilik_barang, 
          keterangan, sekuriti, pos, business_unit, created_at,
          detail_do_masuk(id, nama_barang, jumlah, satuan),
          foto_do_masuk(id, foto, serial_number, storage_path)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (barang_masuk) {
        // Add counts to each item
        const itemsWithCounts = barang_masuk.map((item) => ({
          ...item,
          detail_count: item.detail_do_masuk?.length || 0,
          foto_count: item.foto_do_masuk?.length || 0,
        }));
        setBarangMasuk(itemsWithCounts);
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
    await fetchBarangMasuk();
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

  const deleteItem = async (item: BarangMasukItem) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus data "${item.nomor_do}"?\n\nIni akan menghapus semua foto dan detail yang terkait.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // First, delete photos from Supabase Storage
              if (item.foto_do_masuk && item.foto_do_masuk.length > 0) {
                const deletePhotoPromises = item.foto_do_masuk.map(
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

              // Delete related records from database
              await supabase
                .from("detail_do_masuk")
                .delete()
                .eq("barang_masuk_id", item.id);

              await supabase
                .from("foto_do_masuk")
                .delete()
                .eq("barang_masuk_id", item.id);

              // Delete main record
              const { error } = await supabase
                .from("barang_masuk")
                .delete()
                .eq("id", item.id);

              if (error) throw error;

              await fetchBarangMasuk();

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
    barangMasukId: string
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
              .from("foto_do_masuk")
              .delete()
              .eq("id", photoId);

            if (error) throw error;

            // Refresh the specific item's photos
            await fetchBarangMasuk();

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

  const filteredData = barangMasuk.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.ID && item.ID.toLowerCase().includes(query)) ||
      (item.nomor_do && item.nomor_do.toLowerCase().includes(query)) ||
      (item.nama_pembawa_barang &&
        item.nama_pembawa_barang.toLowerCase().includes(query)) ||
      (item.nama_pemilik_barang &&
        item.nama_pemilik_barang.toLowerCase().includes(query)) ||
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

  const renderDetailItems = (item: BarangMasukItem) => {
    if (!item.detail_do_masuk || item.detail_do_masuk.length === 0) {
      return (
        <View style={styles.noDetailContainer}>
          <Text style={styles.noDetailText}>Tidak ada detail barang</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailItemsContainer}>
        <Text style={styles.detailSectionTitle}>Detail Barang:</Text>
        {item.detail_do_masuk.map((detail, index) => (
          <View key={detail.id || index} style={styles.detailItem}>
            <View style={styles.detailItemHeader}>
              <Icon name="box" type="feather" size={14} color="#007bff" />
              <Text style={styles.detailItemName}>{detail.nama_barang}</Text>
            </View>
            <Text style={styles.detailItemQuantity}>
              {detail.jumlah} {detail.satuan}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPhotoGallery = (item: BarangMasukItem) => {
    if (!item.foto_do_masuk || item.foto_do_masuk.length === 0) {
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
            {item.foto_do_masuk.map((foto, index) => (
              <TouchableOpacity
                key={foto.id || index}
                style={styles.photoThumbnail}
                onPress={() => openPhotoGallery(item.foto_do_masuk!, index)}
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
                {foto.serial_number && (
                  <View style={styles.serialBadge}>
                    <Text style={styles.serialBadgeText} numberOfLines={1}>
                      {foto.serial_number}
                    </Text>
                  </View>
                )}
                {/* Storage indicator */}
                <View style={styles.storageBadge}>
                  <Icon name="cloud" type="feather" size={8} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.photoCount}>
          {item.foto_do_masuk.length} foto tersimpan di cloud storage
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
                <Text style={styles.modalTitle}>Foto Dokumentasi</Text>
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
                      // Find the parent item to get barang_masuk_id
                      const parentItem = barangMasuk.find((item) =>
                        item.foto_do_masuk?.some(
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
              {currentPhoto?.serial_number && (
                <View style={styles.photoInfoItem}>
                  <Icon name="hash" type="feather" size={16} color="#ccc" />
                  <Text style={styles.photoInfoText}>
                    Serial: {currentPhoto.serial_number}
                  </Text>
                </View>
              )}

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

  const renderItem = (item: BarangMasukItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <Card
        key={item.id}
        containerStyle={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      >
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
            <Text style={styles.dateText}>{formatDate(item.tanggal)}</Text>
            <Text style={styles.timeText}>{formatTime(item.jam)}</Text>
            {item.business_unit && (
              <Badge
                value={item.business_unit}
                status="success"
                containerStyle={styles.businessUnitBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="package" type="feather" size={16} color="#007bff" />
            <Text style={styles.statText}>{item.detail_count} Items</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => {
              if (item.foto_do_masuk && item.foto_do_masuk.length > 0) {
                openPhotoGallery(item.foto_do_masuk);
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
              <Icon name="user" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pembawa</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
              {item.nama_pembawa_barang || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="briefcase" type="feather" size={14} color="#495057" />
              <Text style={styles.infoLabel}>Pemilik</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={isExpanded ? 0 : 1}>
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
              {renderDetailItems(item)}
              {renderPhotoGallery(item)}

              <View style={styles.metadataContainer}>
                <Text style={styles.metadataTitle}>Informasi Tambahan:</Text>
                <Text style={styles.metadataText}>
                  Dibuat: {formatDate(item.created_at)}
                </Text>
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
              navigation.navigate("BarangMasukCreate", { editData: item })
            }
          >
            <Icon name="edit-3" type="feather" size={16} color="#007bff" />
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
        <Text style={styles.headerTitle}>Barang Masuk</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSubtitle}>
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "entry" : "entries"}
          </Text>
          <View style={styles.totalStats}>
            <Icon name="package" type="feather" size={12} color="#007bff" />
            <Text style={styles.totalStatsText}>
              {filteredData.reduce(
                (sum, item) => sum + (item.detail_count || 0),
                0
              )}{" "}
              total items
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Cari berdasarkan ID, DO, nama, business unit..."
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
            <Icon name="loader" type="feather" size={32} color="#007bff" />
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
    color: "#007bff",
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
    backgroundColor: "#f8f9fa",
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
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 16,
  },
  detailItemsContainer: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
  },
  detailItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailItemName: {
    fontSize: 14,
    color: "#212529",
    marginLeft: 8,
    flex: 1,
  },
  detailItemQuantity: {
    fontSize: 12,
    color: "#007bff",
    fontWeight: "600",
  },
  noDetailContainer: {
    padding: 16,
    alignItems: "center",
  },
  noDetailText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
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
  serialBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 123, 255, 0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 70,
  },
  serialBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "500",
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
    borderColor: "#007bff",
  },
  miniThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  metadataContainer: {
    padding: 12,
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#f8f9fa",
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
    color: "#007bff",
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
    backgroundColor: "#007bff",
    marginTop: 20,
    paddingHorizontal: 32,
  },
});

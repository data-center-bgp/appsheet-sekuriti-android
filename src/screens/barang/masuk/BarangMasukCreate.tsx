import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import {
  uploadPhotoToStorage,
  deletePhotoFromStorage,
  pickImageFromGallery,
  takePhoto,
  generatePhotoFileName,
  PhotoUploadResult,
} from "../../../utils/photoHandler";
import { Text, Card, Button, Input, Icon, Header } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../types/navigation";
import { generateUUID, generateDataID } from "../../../utils/uuid";

interface DetailDoMasuk {
  id?: string;
  barang_masuk_id?: string;
  ID?: string;
  serial_number: string;
  tanggal?: string;
  jam?: string;
  nama_barang: string;
  jumlah: number;
  satuan: string;
}

interface PhotoItem {
  id?: string;
  uri: string;
  uploaded?: boolean;
  uploading?: boolean;
  serial_number?: string;
  storage_path?: string;
  storage_url?: string;
}

interface UserProfile {
  id: string;
  business_unit: string | null;
}

export default function BarangMasukCreate() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "BarangMasukCreate">>();
  const editData = route.params?.editData;

  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    nomor_do: editData?.nomor_do || "",
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    jam:
      editData?.jam ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    nama_pembawa_barang: editData?.nama_pembawa_barang || "",
    nama_pemilik_barang: editData?.nama_pemilik_barang || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
    pos: editData?.pos || "",
    business_unit: editData?.business_unit || "",
  });

  const [detailItems, setDetailItems] = useState<DetailDoMasuk[]>([
    {
      serial_number: "",
      nama_barang: "",
      jumlah: 0,
      satuan: "",
    },
  ]);

  // Replace fotoItems with photos array for Supabase Storage
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
    if (editData) {
      loadExistingPhotos();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, business_unit")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      setUserProfile(data);

      // Auto-populate business_unit if not editing existing data
      if (!editData && data.business_unit) {
        setFormData((prev) => ({
          ...prev,
          business_unit: data.business_unit,
        }));
      }
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      setError("Gagal mengambil data profil pengguna");
    } finally {
      setProfileLoading(false);
    }
  };

  const loadExistingPhotos = async () => {
    if (!editData?.id) return;

    try {
      const { data: existingPhotos, error } = await supabase
        .from("foto_do_masuk")
        .select("*")
        .eq("barang_masuk_id", editData.id);

      if (error) throw error;

      if (existingPhotos) {
        const photoItems: PhotoItem[] = existingPhotos.map((photo) => ({
          id: photo.id,
          uri: photo.foto,
          uploaded: true,
          uploading: false,
          serial_number: photo.serial_number || "",
          storage_path: photo.storage_path,
          storage_url: photo.foto,
        }));
        setPhotos(photoItems);
      }
    } catch (error) {
      console.error("Error loading existing photos:", error);
    }
  };

  // NEW PHOTO HANDLING FUNCTIONS
  const handleAddPhoto = () => {
    Alert.alert("Pilih Foto", "Pilih sumber foto", [
      { text: "Kamera", onPress: handleTakePhoto },
      { text: "Galeri", onPress: handlePickImage },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets[0]) {
        addPhotoToList(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await pickImageFromGallery();
      if (!result.canceled && result.assets[0]) {
        addPhotoToList(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const addPhotoToList = (uri: string) => {
    const newPhoto: PhotoItem = {
      uri,
      uploaded: false,
      uploading: false,
      serial_number: "",
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];

    Alert.alert("Hapus Foto", "Apakah Anda yakin ingin menghapus foto ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          // If photo was uploaded to storage, delete it
          if (photo.uploaded && photo.storage_path) {
            const result = await deletePhotoFromStorage(photo.storage_path);
            if (!result.success) {
              Alert.alert("Warning", "Failed to delete photo from storage");
            }

            // Also delete from database if it has an ID
            if (photo.id) {
              await supabase.from("foto_do_masuk").delete().eq("id", photo.id);
            }
          }

          setPhotos((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const updatePhotoSerialNumber = (index: number, serialNumber: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) =>
        i === index ? { ...photo, serial_number: serialNumber } : photo
      )
    );
  };

  const uploadAllPhotos = async (barangMasukId: string): Promise<boolean> => {
    if (photos.length === 0) return true;

    setUploadingPhotos(true);
    let allSuccess = true;

    try {
      const uploadPromises = photos.map(async (photo, index) => {
        if (photo.uploaded) return photo; // Skip already uploaded photos

        // Update photo state to show uploading
        setPhotos((prev) =>
          prev.map((p, i) => (i === index ? { ...p, uploading: true } : p))
        );

        const fileName = generatePhotoFileName(barangMasukId, index);
        const uploadResult = await uploadPhotoToStorage(photo.uri, fileName);

        if (uploadResult.success && uploadResult.url && uploadResult.path) {
          // Save photo record to database
          const { data, error } = await supabase
            .from("foto_do_masuk")
            .insert({
              id: generateUUID(),
              barang_masuk_id: barangMasukId,
              ID: formData.ID || generateDataID(),
              foto: uploadResult.url,
              serial_number: photo.serial_number || null,
              storage_path: uploadResult.path,
              tanggal: formData.tanggal,
              jam: formData.jam,
            })
            .select()
            .single();

          if (error) {
            console.error("Database insert error:", error);
            allSuccess = false;
            return { ...photo, uploading: false };
          }

          return {
            ...photo,
            id: data.id,
            uploaded: true,
            uploading: false,
            storage_path: uploadResult.path,
            storage_url: uploadResult.url,
          };
        } else {
          console.error("Upload failed:", uploadResult.error);
          allSuccess = false;
          return { ...photo, uploading: false };
        }
      });

      const updatedPhotos = await Promise.all(uploadPromises);
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error("Photo upload error:", error);
      allSuccess = false;
    } finally {
      setUploadingPhotos(false);
    }

    return allSuccess;
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.nomor_do.trim()) {
      errors.nomor_do = "Nomor DO wajib diisi";
    }
    if (!formData.nama_pembawa_barang.trim()) {
      errors.nama_pembawa_barang = "Nama pembawa wajib diisi";
    }
    if (!formData.nama_pemilik_barang.trim()) {
      errors.nama_pemilik_barang = "Nama pemilik wajib diisi";
    }
    if (!formData.business_unit.trim()) {
      errors.business_unit =
        "Business unit tidak tersedia, hubungi administrator";
    }

    // Validate detail items
    detailItems.forEach((item, index) => {
      if (item.nama_barang.trim() && (!item.jumlah || !item.satuan.trim())) {
        errors[`detail_${index}`] = "Lengkapi semua field untuk item barang";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Detail item functions remain the same
  const addDetailItem = () => {
    setDetailItems([
      ...detailItems,
      {
        serial_number: "",
        nama_barang: "",
        jumlah: 0,
        satuan: "",
      },
    ]);
  };

  const removeDetailItem = (index: number) => {
    if (detailItems.length > 1) {
      const newItems = detailItems.filter((_, i) => i !== index);
      setDetailItems(newItems);
    }
  };

  const updateDetailItem = (
    index: number,
    field: keyof DetailDoMasuk,
    value: any
  ) => {
    const newItems = [...detailItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDetailItems(newItems);
  };

  const handleSubmit = async () => {
    if (profileLoading) {
      Alert.alert("Info", "Mohon tunggu, sedang memuat data profil...");
      return;
    }

    if (!validateForm()) {
      setError("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedId = generateDataID();
      const recordId = formData.id || generateUUID();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      let barangMasukId = recordId;

      if (editData) {
        // Update main record
        const dataToUpdate = {
          ...formData,
          ID: formData.ID || formattedId,
          user_id: user.id,
        };

        const { error: updateError } = await supabase
          .from("barang_masuk")
          .update(dataToUpdate)
          .eq("id", formData.id);

        if (updateError) throw updateError;
        barangMasukId = formData.id!;

        // Delete existing details (photos are handled individually)
        await supabase
          .from("detail_do_masuk")
          .delete()
          .eq("barang_masuk_id", barangMasukId);
      } else {
        // Insert main record
        const dataToInsert = {
          ...formData,
          id: recordId,
          ID: formattedId,
          user_id: user.id,
        };

        const { error: insertError } = await supabase
          .from("barang_masuk")
          .insert([dataToInsert]);

        if (insertError) throw insertError;
      }

      // Insert detail items
      const validDetailItems = detailItems.filter(
        (item) =>
          item.nama_barang.trim() && item.jumlah > 0 && item.satuan.trim()
      );

      if (validDetailItems.length > 0) {
        const detailsToInsert = validDetailItems.map((item) => ({
          id: generateUUID(),
          barang_masuk_id: barangMasukId,
          ID: formData.ID || formattedId,
          serial_number: item.serial_number,
          tanggal: formData.tanggal,
          jam: formData.jam,
          nama_barang: item.nama_barang,
          jumlah: item.jumlah,
          satuan: item.satuan,
        }));

        const { error: detailError } = await supabase
          .from("detail_do_masuk")
          .insert(detailsToInsert);

        if (detailError) throw detailError;
      }

      // Upload new photos
      const photoUploadSuccess = await uploadAllPhotos(barangMasukId);
      if (!photoUploadSuccess) {
        Alert.alert("Warning", "Some photos failed to upload");
      }

      Alert.alert(
        "Berhasil",
        editData ? "Data berhasil diperbarui" : "Data berhasil disimpan",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Date/Time functions remain the same
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const currentDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, tanggal: currentDate });
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const currentTime = selectedTime.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      });
      setFormData({ ...formData, jam: currentTime });
    }
  };

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.tanggal),
      onChange: onChangeDate,
      mode: "date",
    });
  };

  const showTimePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(`1970-01-01T${formData.jam}:00`),
      onChange: onChangeTime,
      mode: "time",
      is24Hour: true,
    });
  };

  const DateTimeSelector = ({
    label,
    value,
    onPress,
    icon,
  }: {
    label: string;
    value: string;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity style={styles.dateTimeCard} onPress={onPress}>
      <View style={styles.dateTimeContent}>
        <Icon name={icon} type="feather" size={20} color="#007bff" />
        <View style={styles.dateTimeText}>
          <Text style={styles.dateTimeLabel}>{label}</Text>
          <Text style={styles.dateTimeValue}>{value}</Text>
        </View>
        <Icon name="chevron-right" type="feather" size={20} color="#6c757d" />
      </View>
    </TouchableOpacity>
  );

  const renderDetailItem = (item: DetailDoMasuk, index: number) => (
    <Card key={index} containerStyle={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Item #{index + 1}</Text>
        {detailItems.length > 1 && (
          <TouchableOpacity
            onPress={() => removeDetailItem(index)}
            style={styles.removeButton}
          >
            <Icon name="trash-2" type="feather" size={16} color="#dc3545" />
          </TouchableOpacity>
        )}
      </View>

      <Input
        placeholder="Serial number (opsional)"
        label="Serial Number"
        value={item.serial_number}
        onChangeText={(text) => updateDetailItem(index, "serial_number", text)}
        leftIcon={{
          name: "hash",
          type: "feather",
          size: 20,
          color: "#6c757d",
        }}
        inputContainerStyle={styles.inputContainer}
        labelStyle={styles.inputLabel}
      />

      <Input
        placeholder="Nama barang *"
        label="Nama Barang"
        value={item.nama_barang}
        onChangeText={(text) => updateDetailItem(index, "nama_barang", text)}
        leftIcon={{
          name: "box",
          type: "feather",
          size: 20,
          color: "#6c757d",
        }}
        inputContainerStyle={styles.inputContainer}
        labelStyle={styles.inputLabel}
      />

      <View style={styles.twoColumnRow}>
        <View style={styles.halfInput}>
          <Input
            placeholder="Jumlah *"
            label="Jumlah"
            value={item.jumlah.toString()}
            onChangeText={(text) =>
              updateDetailItem(index, "jumlah", parseInt(text) || 0)
            }
            keyboardType="numeric"
            leftIcon={{
              name: "plus",
              type: "feather",
              size: 20,
              color: "#6c757d",
            }}
            inputContainerStyle={styles.inputContainer}
            labelStyle={styles.inputLabel}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            placeholder="Satuan *"
            label="Satuan"
            value={item.satuan}
            onChangeText={(text) => updateDetailItem(index, "satuan", text)}
            leftIcon={{
              name: "tag",
              type: "feather",
              size: 20,
              color: "#6c757d",
            }}
            inputContainerStyle={styles.inputContainer}
            labelStyle={styles.inputLabel}
          />
        </View>
      </View>

      {validationErrors[`detail_${index}`] && (
        <Text style={styles.itemErrorText}>
          {validationErrors[`detail_${index}`]}
        </Text>
      )}
    </Card>
  );

  // NEW PHOTO SECTION RENDER
  const renderPhotoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderWithAction}>
        <Text style={styles.sectionTitle}>Foto Dokumentasi</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
          <Icon name="plus" type="feather" size={16} color="white" />
          <Text style={styles.addButtonText}>Tambah Foto</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photoList}>
            {photos.map((photo, index) => (
              <Card key={index} containerStyle={styles.photoCard}>
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: photo.storage_url || photo.uri }}
                    style={styles.photoPreview}
                  />

                  {photo.uploading && (
                    <View style={styles.uploadingOverlay}>
                      <Icon
                        name="loader"
                        type="feather"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}

                  {photo.uploaded && (
                    <View style={styles.uploadedBadge}>
                      <Icon
                        name="check"
                        type="feather"
                        size={12}
                        color="white"
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Icon name="x" type="feather" size={16} color="white" />
                  </TouchableOpacity>
                </View>

                <Input
                  placeholder="Serial number (optional)"
                  value={photo.serial_number}
                  onChangeText={(text) => updatePhotoSerialNumber(index, text)}
                  containerStyle={styles.serialInputContainer}
                  inputStyle={styles.serialInput}
                  inputContainerStyle={styles.serialInputInnerContainer}
                />
              </Card>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Card containerStyle={styles.emptyPhotoCard}>
          <View style={styles.emptyPhotoContainer}>
            <Icon name="camera" type="feather" size={48} color="#6c757d" />
            <Text style={styles.emptyPhotoText}>Belum ada foto</Text>
            <Text style={styles.emptyPhotoSubtext}>
              Tap "Tambah Foto" untuk menambahkan dokumentasi
            </Text>
          </View>
        </Card>
      )}

      {uploadingPhotos && (
        <View style={styles.uploadProgress}>
          <Icon name="upload" type="feather" size={16} color="#007bff" />
          <Text style={styles.uploadProgressText}>Mengupload foto...</Text>
        </View>
      )}
    </View>
  );

  // Show loading screen while fetching profile
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Tambah Barang Masuk",
            style: { color: "white", fontSize: 18, fontWeight: "bold" },
          }}
          leftComponent={{
            icon: "arrow-left",
            type: "feather",
            color: "white",
            onPress: () => navigation.goBack(),
          }}
          backgroundColor="#007bff"
          barStyle="light-content"
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" type="feather" size={32} color="#007bff" />
          <Text style={styles.loadingText}>Memuat data profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: editData ? "Edit Barang Masuk" : "Tambah Barang Masuk",
          style: { color: "white", fontSize: 18, fontWeight: "bold" },
        }}
        leftComponent={{
          icon: "arrow-left",
          type: "feather",
          color: "white",
          onPress: () => navigation.goBack(),
        }}
        backgroundColor="#007bff"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Header */}
          <View style={styles.formHeader}>
            <Icon
              name="package"
              type="feather"
              size={32}
              color="#007bff"
              containerStyle={styles.headerIcon}
            />
            <Text style={styles.formTitle}>
              {editData ? "Edit Data Barang Masuk" : "Data Barang Masuk Baru"}
            </Text>
            <Text style={styles.formSubtitle}>
              Lengkapi informasi barang yang masuk ke area
            </Text>
            {/* Business Unit Info */}
            {userProfile?.business_unit && (
              <View style={styles.businessUnitInfo}>
                <Icon
                  name="building"
                  type="font-awesome-5"
                  size={16}
                  color="#28a745"
                />
                <Text style={styles.businessUnitText}>
                  Business Unit: {userProfile.business_unit}
                </Text>
              </View>
            )}
          </View>

          {/* Basic Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="info" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Dasar</Text>
            </View>

            <Input
              placeholder="Masukkan nomor DO"
              label="Nomor DO *"
              value={formData.nomor_do}
              onChangeText={(text) => {
                setFormData({ ...formData, nomor_do: text });
                if (validationErrors.nomor_do) {
                  setValidationErrors({ ...validationErrors, nomor_do: "" });
                }
              }}
              errorMessage={validationErrors.nomor_do}
              leftIcon={{
                name: "file-text",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />

            <View style={styles.dateTimeSection}>
              <Text style={styles.sectionLabel}>Tanggal & Waktu</Text>
              <View style={styles.dateTimeGrid}>
                <DateTimeSelector
                  label="Tanggal"
                  value={formData.tanggal}
                  onPress={showDatePickerDialog}
                  icon="calendar"
                />
                <DateTimeSelector
                  label="Jam"
                  value={formData.jam}
                  onPress={showTimePickerDialog}
                  icon="clock"
                />
              </View>
            </View>
          </Card>

          {/* Personnel Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="users" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Personel</Text>
            </View>

            <Input
              placeholder="Nama lengkap pembawa barang"
              label="Nama Pembawa Barang *"
              value={formData.nama_pembawa_barang}
              onChangeText={(text) => {
                setFormData({ ...formData, nama_pembawa_barang: text });
                if (validationErrors.nama_pembawa_barang) {
                  setValidationErrors({
                    ...validationErrors,
                    nama_pembawa_barang: "",
                  });
                }
              }}
              errorMessage={validationErrors.nama_pembawa_barang}
              leftIcon={{
                name: "user",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />

            <Input
              placeholder="Nama lengkap pemilik barang"
              label="Nama Pemilik Barang *"
              value={formData.nama_pemilik_barang}
              onChangeText={(text) => {
                setFormData({ ...formData, nama_pemilik_barang: text });
                if (validationErrors.nama_pemilik_barang) {
                  setValidationErrors({
                    ...validationErrors,
                    nama_pemilik_barang: "",
                  });
                }
              }}
              errorMessage={validationErrors.nama_pemilik_barang}
              leftIcon={{
                name: "briefcase",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />
          </Card>

          {/* Detail Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={styles.sectionTitle}>Detail Barang</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addDetailItem}
              >
                <Icon name="plus" type="feather" size={16} color="white" />
                <Text style={styles.addButtonText}>Tambah Item</Text>
              </TouchableOpacity>
            </View>
            {detailItems.map((item, index) => renderDetailItem(item, index))}
          </View>

          {/* Photo Section - UPDATED */}
          {renderPhotoSection()}

          {/* Additional Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="edit-3" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Tambahan</Text>
            </View>

            <Input
              placeholder="Deskripsi barang atau catatan khusus"
              label="Keterangan"
              value={formData.keterangan}
              onChangeText={(text) =>
                setFormData({ ...formData, keterangan: text })
              }
              multiline
              numberOfLines={3}
              leftIcon={{
                name: "message-square",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.textAreaContainer}
              labelStyle={styles.inputLabel}
            />

            <View style={styles.twoColumnRow}>
              <View style={styles.halfInput}>
                <Input
                  placeholder="Nama sekuriti"
                  label="Sekuriti"
                  value={formData.sekuriti}
                  onChangeText={(text) =>
                    setFormData({ ...formData, sekuriti: text })
                  }
                  leftIcon={{
                    name: "shield",
                    type: "feather",
                    size: 20,
                    color: "#6c757d",
                  }}
                  inputContainerStyle={styles.inputContainer}
                  labelStyle={styles.inputLabel}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  placeholder="Pos/Lokasi"
                  label="Pos"
                  value={formData.pos}
                  onChangeText={(text) =>
                    setFormData({ ...formData, pos: text })
                  }
                  leftIcon={{
                    name: "map-pin",
                    type: "feather",
                    size: 20,
                    color: "#6c757d",
                  }}
                  inputContainerStyle={styles.inputContainer}
                  labelStyle={styles.inputLabel}
                />
              </View>
            </View>
          </Card>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon
                name="alert-circle"
                type="feather"
                size={18}
                color="#dc3545"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Business Unit Validation Error */}
          {validationErrors.business_unit && (
            <View style={styles.errorContainer}>
              <Icon
                name="alert-triangle"
                type="feather"
                size={18}
                color="#ffc107"
              />
              <Text style={styles.errorText}>
                {validationErrors.business_unit}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Batal"
              onPress={() => navigation.goBack()}
              buttonStyle={styles.cancelButton}
              titleStyle={styles.cancelButtonText}
              type="outline"
              containerStyle={styles.buttonContainer}
            />
            <Button
              title={loading ? "Menyimpan..." : "Simpan"}
              onPress={handleSubmit}
              disabled={loading || profileLoading || uploadingPhotos}
              buttonStyle={styles.submitButton}
              titleStyle={styles.submitButtonText}
              loading={loading}
              containerStyle={styles.buttonContainer}
              icon={
                loading
                  ? undefined
                  : {
                      name: "save",
                      type: "feather",
                      color: "white",
                      size: 18,
                    }
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 16,
  },
  formHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerIcon: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  businessUnitInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#d4edda",
    borderRadius: 6,
    gap: 6,
  },
  businessUnitText: {
    fontSize: 12,
    color: "#155724",
    fontWeight: "500",
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 4,
  },
  textAreaContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 4,
    minHeight: 60,
  },
  inputLabel: {
    color: "#495057",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateTimeSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  dateTimeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  dateTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  dateTimeText: {
    flex: 1,
    marginLeft: 8,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  itemCard: {
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderWidth: 0,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  removeButton: {
    padding: 4,
  },
  itemErrorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    paddingLeft: 12,
  },

  // NEW PHOTO STYLES
  photoList: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
  },
  photoCard: {
    borderRadius: 8,
    margin: 0,
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderWidth: 0,
    width: 150,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 8,
  },
  photoPreview: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  uploadingText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
  },
  uploadedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#28a745",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#dc3545",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  serialInputContainer: {
    height: 40,
    marginBottom: 0,
  },
  serialInput: {
    fontSize: 12,
  },
  serialInputInnerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 2,
  },
  emptyPhotoCard: {
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderWidth: 0,
  },
  emptyPhotoContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyPhotoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
    marginTop: 12,
  },
  emptyPhotoSubtext: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
    textAlign: "center",
  },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  uploadProgressText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8d7da",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  errorText: {
    color: "#721c24",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  buttonContainer: {
    flex: 1,
  },
  cancelButton: {
    borderColor: "#6c757d",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    height: 48,
  },
  cancelButtonText: {
    color: "#6c757d",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    height: 48,
  },
  submitButtonText: {
    fontWeight: "600",
    marginLeft: 8,
  },
});

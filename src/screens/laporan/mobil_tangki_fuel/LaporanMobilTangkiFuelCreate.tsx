import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, Card, Button, Input, Icon, Header } from "@rneui/themed";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../types/navigation";
import { generateUUID, generateDataID } from "../../../utils/uuid";
import DropdownSelector from "../../../components/DropdownSelector";
import { getSecurityDropdownOptions } from "../../../utils/dropdown";
import { useUserBusinessUnit } from "../../../hooks/useUserBusinessUnit";

interface UserProfile {
  id: string;
  business_unit: string | null;
}

export default function LaporanMobilTangkiFuelCreate() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<RootStackParamList, "LaporanMobilTangkiFuelCreate">>();
  const editData = route.params?.editData;

  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    nama_driver: editData?.nama_driver || "",
    quantity: editData?.quantity?.toString() || "",
    tujuan: editData?.tujuan || "",
    approved_by: editData?.approved_by || "",
    surat_jalan: editData?.surat_jalan || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
    business_unit: editData?.business_unit || "",
  });

  const { businessUnit, loading: businessUnitLoading } = useUserBusinessUnit();
  const securityOptions = getSecurityDropdownOptions(businessUnit);

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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.nama_driver.trim()) {
      errors.nama_driver = "Nama driver wajib diisi";
    }
    if (!formData.quantity.trim()) {
      errors.quantity = "Quantity wajib diisi";
    }
    if (!formData.tujuan.trim()) {
      errors.tujuan = "Tujuan wajib diisi";
    }
    if (!formData.approved_by.trim()) {
      errors.approved_by = "Approved by wajib diisi";
    }
    if (!formData.business_unit.trim()) {
      errors.business_unit =
        "Business unit tidak tersedia, hubungi administrator";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

      // Convert quantity to number for database
      const dataToSave = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
      };

      if (editData) {
        // Update existing record
        const dataToUpdate = {
          ...dataToSave,
          ID: formData.ID || formattedId,
          user_id: user.id,
        };

        const { error: updateError } = await supabase
          .from("laporan_mobil_tangki_fuel")
          .update(dataToUpdate)
          .eq("id", formData.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const dataToInsert = {
          ...dataToSave,
          id: recordId,
          ID: formattedId,
          user_id: user.id,
        };

        const { error: insertError } = await supabase
          .from("laporan_mobil_tangki_fuel")
          .insert([dataToInsert]);

        if (insertError) throw insertError;
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

  // Date function
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const currentDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, tanggal: currentDate });
    }
  };

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.tanggal),
      onChange: onChangeDate,
      mode: "date",
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
        <Icon name={icon} type="feather" size={20} color="#fd7e14" />
        <View style={styles.dateTimeText}>
          <Text style={styles.dateTimeLabel}>{label}</Text>
          <Text style={styles.dateTimeValue}>{value}</Text>
        </View>
        <Icon name="chevron-right" type="feather" size={20} color="#6c757d" />
      </View>
    </TouchableOpacity>
  );

  // Show loading screen while fetching profile
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Tambah Laporan Mobil Tangki",
            style: { color: "white", fontSize: 18, fontWeight: "bold" },
          }}
          leftComponent={{
            icon: "arrow-left",
            type: "feather",
            color: "white",
            onPress: () => navigation.goBack(),
          }}
          backgroundColor="#fd7e14"
          barStyle="light-content"
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" type="feather" size={32} color="#fd7e14" />
          <Text style={styles.loadingText}>Memuat data profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: editData
            ? "Edit Laporan Mobil Tangki"
            : "Tambah Laporan Mobil Tangki",
          style: { color: "white", fontSize: 18, fontWeight: "bold" },
        }}
        leftComponent={{
          icon: "arrow-left",
          type: "feather",
          color: "white",
          onPress: () => navigation.goBack(),
        }}
        backgroundColor="#fd7e14"
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
              name="truck"
              type="feather"
              size={32}
              color="#fd7e14"
              containerStyle={styles.headerIcon}
            />
            <Text style={styles.formTitle}>
              {editData
                ? "Edit Data Laporan Mobil Tangki"
                : "Data Laporan Mobil Tangki Baru"}
            </Text>
            <Text style={styles.formSubtitle}>
              Lengkapi informasi laporan mobil tangki fuel
            </Text>
            {/* Business Unit Info */}
            {userProfile?.business_unit && (
              <View style={styles.businessUnitInfo}>
                <Icon
                  name="building"
                  type="font-awesome-5"
                  size={16}
                  color="#fd7e14"
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

            <View style={styles.dateTimeSection}>
              <Text style={styles.sectionLabel}>Tanggal</Text>
              <View style={styles.dateTimeGrid}>
                <DateTimeSelector
                  label="Tanggal"
                  value={formData.tanggal}
                  onPress={showDatePickerDialog}
                  icon="calendar"
                />
              </View>
            </View>
          </Card>

          {/* Driver & Vehicle Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="truck" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Driver & Kendaraan</Text>
            </View>

            <Input
              placeholder="Nama lengkap driver"
              label="Nama Driver *"
              value={formData.nama_driver}
              onChangeText={(text) => {
                setFormData({ ...formData, nama_driver: text });
                if (validationErrors.nama_driver) {
                  setValidationErrors({
                    ...validationErrors,
                    nama_driver: "",
                  });
                }
              }}
              errorMessage={validationErrors.nama_driver}
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
              placeholder="Jumlah fuel dalam liter"
              label="Quantity *"
              value={formData.quantity}
              onChangeText={(text) => {
                setFormData({ ...formData, quantity: text });
                if (validationErrors.quantity) {
                  setValidationErrors({
                    ...validationErrors,
                    quantity: "",
                  });
                }
              }}
              errorMessage={validationErrors.quantity}
              keyboardType="numeric"
              leftIcon={{
                name: "droplet",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />
          </Card>

          {/* Delivery Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="map-pin" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Pengiriman</Text>
            </View>

            <Input
              placeholder="Alamat atau lokasi tujuan"
              label="Tujuan *"
              value={formData.tujuan}
              onChangeText={(text) => {
                setFormData({ ...formData, tujuan: text });
                if (validationErrors.tujuan) {
                  setValidationErrors({
                    ...validationErrors,
                    tujuan: "",
                  });
                }
              }}
              errorMessage={validationErrors.tujuan}
              leftIcon={{
                name: "map-pin",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />

            <Input
              placeholder="Nomor atau referensi surat jalan"
              label="Surat Jalan"
              value={formData.surat_jalan}
              onChangeText={(text) =>
                setFormData({ ...formData, surat_jalan: text })
              }
              leftIcon={{
                name: "file-text",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />
          </Card>

          {/* Authorization Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon
                name="check-circle"
                type="feather"
                size={18}
                color="#495057"
              />
              <Text style={styles.cardTitle}>Informasi Otorisasi</Text>
            </View>

            <Input
              placeholder="Nama yang menyetujui pengiriman"
              label="Approved By *"
              value={formData.approved_by}
              onChangeText={(text) => {
                setFormData({ ...formData, approved_by: text });
                if (validationErrors.approved_by) {
                  setValidationErrors({
                    ...validationErrors,
                    approved_by: "",
                  });
                }
              }}
              errorMessage={validationErrors.approved_by}
              leftIcon={{
                name: "user-check",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />

            <Input
              placeholder="Catatan atau keterangan tambahan"
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
          </Card>

          {/* Additional Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="edit-3" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Tambahan</Text>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.halfInput}>
                <DropdownSelector
                  label="Sekuriti"
                  placeholder="Pilih nama sekuriti"
                  value={formData.sekuriti}
                  options={securityOptions}
                  onSelect={(value) =>
                    setFormData({ ...formData, sekuriti: value })
                  }
                  leftIcon={{
                    name: "shield",
                    type: "feather",
                    size: 20,
                    color: "#6c757d",
                  }}
                  disabled={businessUnitLoading}
                  required={false}
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
              disabled={loading || profileLoading}
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
    backgroundColor: "#fff3cd",
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
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    gap: 6,
  },
  businessUnitText: {
    fontSize: 12,
    color: "#856404",
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
    marginBottom: 12,
  },
  dateTimeCard: {
    flex: 1,
    backgroundColor: "#fff3cd",
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
    backgroundColor: "#fd7e14",
    borderRadius: 8,
    height: 48,
  },
  submitButtonText: {
    fontWeight: "600",
    marginLeft: 8,
  },
});

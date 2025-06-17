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

interface UserProfile {
  id: string;
  business_unit: string | null;
}

export default function LaporanBunkerFreshWaterCreate() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<RootStackParamList, "LaporanBunkerFreshWaterCreate">>();
  const editData = route.params?.editData;

  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    nama_kapal: editData?.nama_kapal || "",
    tempat_bunker: editData?.tempat_bunker || "",
    waktu_mulai:
      editData?.waktu_mulai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    waktu_selesai:
      editData?.waktu_selesai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    quantity: editData?.quantity || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
    business_unit: editData?.business_unit || "",
  });

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

    if (!formData.nama_kapal.trim()) {
      errors.nama_kapal = "Nama kapal wajib diisi";
    }
    if (!formData.tempat_bunker.trim()) {
      errors.tempat_bunker = "Tempat bunker wajib diisi";
    }
    if (!formData.quantity.trim()) {
      errors.quantity = "Quantity wajib diisi";
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

      if (editData) {
        // Update existing record
        const dataToUpdate = {
          ...formData,
          ID: formData.ID || formattedId,
          user_id: user.id,
        };

        const { error: updateError } = await supabase
          .from("laporan_bunker_freshwater")
          .update(dataToUpdate)
          .eq("id", formData.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const dataToInsert = {
          ...formData,
          id: recordId,
          ID: formattedId,
          user_id: user.id,
        };

        const { error: insertError } = await supabase
          .from("laporan_bunker_freshwater")
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

  // Date/Time functions
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const currentDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, tanggal: currentDate });
    }
  };

  const onChangeWaktuMulai = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const currentTime = selectedTime.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      });
      setFormData({ ...formData, waktu_mulai: currentTime });
    }
  };

  const onChangeWaktuSelesai = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const currentTime = selectedTime.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      });
      setFormData({ ...formData, waktu_selesai: currentTime });
    }
  };

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.tanggal),
      onChange: onChangeDate,
      mode: "date",
    });
  };

  const showWaktuMulaiPickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(`1970-01-01T${formData.waktu_mulai}:00`),
      onChange: onChangeWaktuMulai,
      mode: "time",
      is24Hour: true,
    });
  };

  const showWaktuSelesaiPickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(`1970-01-01T${formData.waktu_selesai}:00`),
      onChange: onChangeWaktuSelesai,
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
        <Icon name={icon} type="feather" size={20} color="#28a745" />
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
            text: "Tambah Laporan Bunker",
            style: { color: "white", fontSize: 18, fontWeight: "bold" },
          }}
          leftComponent={{
            icon: "arrow-left",
            type: "feather",
            color: "white",
            onPress: () => navigation.goBack(),
          }}
          backgroundColor="#28a745"
          barStyle="light-content"
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" type="feather" size={32} color="#28a745" />
          <Text style={styles.loadingText}>Memuat data profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: editData ? "Edit Laporan Bunker" : "Tambah Laporan Bunker",
          style: { color: "white", fontSize: 18, fontWeight: "bold" },
        }}
        leftComponent={{
          icon: "arrow-left",
          type: "feather",
          color: "white",
          onPress: () => navigation.goBack(),
        }}
        backgroundColor="#28a745"
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
              name="file-text"
              type="feather"
              size={32}
              color="#28a745"
              containerStyle={styles.headerIcon}
            />
            <Text style={styles.formTitle}>
              {editData
                ? "Edit Data Laporan Bunker"
                : "Data Laporan Bunker Baru"}
            </Text>
            <Text style={styles.formSubtitle}>
              Lengkapi informasi laporan bunker dan fresh water
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

            <View style={styles.dateTimeSection}>
              <Text style={styles.sectionLabel}>Tanggal & Waktu</Text>
              <View style={styles.dateTimeGrid}>
                <DateTimeSelector
                  label="Tanggal"
                  value={formData.tanggal}
                  onPress={showDatePickerDialog}
                  icon="calendar"
                />
              </View>
              <View style={styles.timeGrid}>
                <DateTimeSelector
                  label="Waktu Mulai"
                  value={formData.waktu_mulai}
                  onPress={showWaktuMulaiPickerDialog}
                  icon="clock"
                />
                <DateTimeSelector
                  label="Waktu Selesai"
                  value={formData.waktu_selesai}
                  onPress={showWaktuSelesaiPickerDialog}
                  icon="clock"
                />
              </View>
            </View>
          </Card>

          {/* Vessel & Location Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="anchor" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Kapal & Lokasi</Text>
            </View>

            <Input
              placeholder="Nama kapal yang melakukan bunker"
              label="Nama Kapal *"
              value={formData.nama_kapal}
              onChangeText={(text) => {
                setFormData({ ...formData, nama_kapal: text });
                if (validationErrors.nama_kapal) {
                  setValidationErrors({
                    ...validationErrors,
                    nama_kapal: "",
                  });
                }
              }}
              errorMessage={validationErrors.nama_kapal}
              leftIcon={{
                name: "anchor",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />

            <Input
              placeholder="Lokasi tempat bunker dilakukan"
              label="Tempat Bunker *"
              value={formData.tempat_bunker}
              onChangeText={(text) => {
                setFormData({ ...formData, tempat_bunker: text });
                if (validationErrors.tempat_bunker) {
                  setValidationErrors({
                    ...validationErrors,
                    tempat_bunker: "",
                  });
                }
              }}
              errorMessage={validationErrors.tempat_bunker}
              leftIcon={{
                name: "map-pin",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />
          </Card>

          {/* Fuel Information Card */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="zap" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Bahan Bakar</Text>
            </View>

            <Input
              placeholder="Jumlah dalam liter atau kiloliter"
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
    backgroundColor: "#d4f7dc",
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
    marginBottom: 12,
  },
  timeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeCard: {
    flex: 1,
    backgroundColor: "#d4f7dc",
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
    backgroundColor: "#28a745",
    borderRadius: 8,
    height: 48,
  },
  submitButtonText: {
    fontWeight: "600",
    marginLeft: 8,
  },
});

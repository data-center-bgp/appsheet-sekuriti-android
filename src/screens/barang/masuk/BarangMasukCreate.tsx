import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Card, Button, Input, Icon, Header } from "@rneui/themed";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../types/navigation";
import { generateUUID, generateDataID } from "../../../utils/uuid";

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
    file_pdf: editData?.file_pdf || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

  const handleSubmit = async () => {
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
        const dataToUpdate = {
          ...formData,
          ID: formData.ID || formattedId,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from("barang_masuk")
          .update(dataToUpdate)
          .eq("id", formData.id);

        if (error) throw error;
      } else {
        const dataToInsert = {
          ...formData,
          id: recordId,
          ID: formattedId,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from("barang_masuk")
          .insert([dataToInsert]);

        if (error) throw error;
      }

      navigation.goBack();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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

            <Input
              placeholder="Link atau nama file PDF"
              label="File PDF"
              value={formData.file_pdf}
              onChangeText={(text) =>
                setFormData({ ...formData, file_pdf: text })
              }
              leftIcon={{
                name: "file",
                type: "feather",
                size: 20,
                color: "#6c757d",
              }}
              inputContainerStyle={styles.inputContainer}
              labelStyle={styles.inputLabel}
            />
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
              disabled={loading}
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

import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/base";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { generateUUID, generateDataID } from "../utils/uuid";
import { createTimeChangeHandler, openTimePicker } from "../utils/timeHandler";
import { createDateChangeHandler, openDatePicker } from "../utils/dateHandler";

export default function LaporanTambatCreate() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<RootStackParamList, "LaporanTambatCreate">>();
  const editData = route.params?.editData;
  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    nama_kapal: editData?.nama_pengirim || "",
    nama_perusahaan: editData?.nama_perusahaan || "",
    tanggal_mulai_tambat:
      editData?.tanggal || new Date().toISOString().split("T")[0],
    waktu_mulai_tambat:
      editData?.waktu_mulai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    tanggal_selesai_tambat:
      editData?.tanggal || new Date().toISOString().split("T")[0],
    waktu_selesai_tambat:
      editData?.waktu_mulai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    kegiatan: editData?.kegiatan || "",
    tanggal_mulai_connect:
      editData?.tanggal || new Date().toISOString().split("T")[0],
    waktu_mulai_connect:
      editData?.waktu_mulai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    tanggal_selesai_connect:
      editData?.tanggal || new Date().toISOString().split("T")[0],
    waktu_selesai_connect:
      editData?.waktu_mulai ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    lokasi: editData?.lokasi || "",
    sekuriti: editData?.sekuriti || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formattedId = generateDataID();
      const recordId = formData.id || generateUUID();
      console.log("Generated IDs:", { formattedId, recordId });
      console.log("Original formData:", formData);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      console.log("User ID:", user.id);

      const dataWithIds = {
        ...formData,
        id: recordId,
        ID: formData.ID || formattedId,
        user_id: user.id,
      };

      console.log("Data to be inserted:", dataWithIds);

      if (editData) {
        const dataToUpdate = {
          ...formData,
          ID: formData.ID || formattedId,
          user_id: user.id,
        };

        console.log("Data to be updated:", dataToUpdate);
        console.log("Using ID for eq condition:", formData.id);

        const { data, error } = await supabase
          .from("laporan_tambat")
          .update(dataToUpdate)
          .eq("id", formData.id);

        console.log("Update response:", { data, error });
        if (error) throw error;
      } else {
        const dataToInsert = {
          ...formData,
          id: recordId,
          ID: formattedId,
          user_id: user.id,
        };

        console.log("Data to be inserted:", dataToInsert);

        const { data, error } = await supabase
          .from("laporan_tambat")
          .insert([dataToInsert]);

        console.log("Insert response:", { data, error });

        if (error) throw error;
      }

      navigation.goBack();
    } catch (error: any) {
      setError(error.message);
      console.error("Error saving data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateStartTambat = createDateChangeHandler(
    setFormData,
    "tanggal_mulai_tambat"
  );
  const handleDateEndTambat = createDateChangeHandler(
    setFormData,
    "tanggal_selesai_tambat"
  );
  const handleDateStartConnect = createDateChangeHandler(
    setFormData,
    "tanggal_mulai_connect"
  );
  const handleDateEndConnect = createDateChangeHandler(
    setFormData,
    "tanggal_selesai_connect"
  );

  const handleDateEnd = createDateChangeHandler(
    setFormData,
    "tanggal_selesai_tambat"
  );

  const handleTimeStartTambat = createTimeChangeHandler(
    setFormData,
    "waktu_mulai_tambat"
  );
  const handleTimeEndTambat = createTimeChangeHandler(
    setFormData,
    "waktu_selesai_tambat"
  );
  const handleTimeStartConnect = createTimeChangeHandler(
    setFormData,
    "waktu_mulai_connect"
  );
  const handleTimeEndConnect = createTimeChangeHandler(
    setFormData,
    "waktu_selesai_connect"
  );

  const openStartDateTambatPicker = () => {
    openDatePicker(formData.tanggal_mulai_tambat, handleDateStartTambat);
  };

  const openEndDateTambatPicker = () => {
    openDatePicker(formData.tanggal_selesai_tambat, handleDateEndTambat);
  };

  const openStartDateConnectPicker = () => {
    openDatePicker(formData.tanggal_mulai_connect, handleDateStartConnect);
  };

  const openEndDateConnectPicker = () => {
    openDatePicker(formData.tanggal_selesai_connect, handleDateEndConnect);
  };

  const openStartTimeTambatPicker = () => {
    openTimePicker(formData.waktu_mulai_tambat, handleTimeStartTambat);
  };

  const openEndTimeTambatPicker = () => {
    openTimePicker(formData.waktu_selesai_tambat, handleTimeEndTambat);
  };

  const openStartTimeConnectPicker = () => {
    openTimePicker(formData.waktu_mulai_connect, handleTimeStartConnect);
  };

  const openEndTimeConnectPicker = () => {
    openTimePicker(formData.waktu_selesai_connect, handleTimeEndConnect);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Card containerStyle={styles.card}>
          <Card.Title>{editData ? "Edit Data" : "Tambah Data Baru"}</Card.Title>
          <Card.Divider />
          <Input
            placeholder="Nama Kapal"
            value={formData.nama_kapal}
            onChangeText={(text) =>
              setFormData({ ...formData, nama_kapal: text })
            }
          />
          <Input
            placeholder="Nama Perusahaan"
            value={formData.nama_perusahaan}
            onChangeText={(text) =>
              setFormData({ ...formData, nama_perusahaan: text })
            }
          />
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal_mulai_tambat}</Text>
            <Button
              title="Pilih Tanggal Mulai Tambat"
              onPress={openStartDateTambatPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu: {formData.waktu_mulai_tambat}</Text>
            <Button
              title="Pilih Waktu Mulai Tambat"
              onPress={openStartTimeTambatPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal_selesai_tambat}</Text>
            <Button
              title="Pilih Tanggal Selesai Tambat"
              onPress={openEndDateTambatPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu: {formData.waktu_selesai_tambat}</Text>
            <Button
              title="Pilih Waktu Selesai Tambat"
              onPress={openEndTimeTambatPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <Input
            placeholder="Kegiatan"
            value={formData.kegiatan}
            onChangeText={(text) =>
              setFormData({ ...formData, kegiatan: text })
            }
          />
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal_mulai_connect}</Text>
            <Button
              title="Pilih Tanggal Mulai Connect"
              onPress={openStartDateConnectPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu: {formData.waktu_mulai_connect}</Text>
            <Button
              title="Pilih Waktu Mulai Connect"
              onPress={openStartTimeConnectPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal_selesai_connect}</Text>
            <Button
              title="Pilih Tanggal Selesai Connect"
              onPress={openEndDateConnectPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu: {formData.waktu_selesai_connect}</Text>
            <Button
              title="Pilih Waktu Selesai Connect"
              onPress={openEndTimeConnectPicker}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <Input
            placeholder="Sekuriti"
            value={formData.sekuriti}
            onChangeText={(text) =>
              setFormData({ ...formData, sekuriti: text })
            }
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button
            title={loading ? "Menyimpan..." : "Simpan"}
            onPress={handleSubmit}
            disabled={loading}
            buttonStyle={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flexGrow: 1,
    padding: 12,
  },
  card: {
    borderRadius: 8,
    marginHorizontal: 0,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dateTimeButton: {
    minWidth: 120,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#2089dc",
  },
});

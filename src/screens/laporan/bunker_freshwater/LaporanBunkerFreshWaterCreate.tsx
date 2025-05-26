import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/base";
import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../../types/navigation";
import { generateUUID, generateDataID } from "../../../../utils/uuid";
import {
  createTimeChangeHandler,
  openTimePicker,
} from "../../../../utils/timeHandler";

export default function LaporanBunkerFreshWaterCreate() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<RootStackParamList, "LaporanBunkerFreshWaterCreate">>();
  const editData = route.params?.editData;
  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    nama_kapal: editData?.nama_pengirim || "",
    tempat_bunker: editData?.nama_penerima || "",
    jenis_surat: editData?.jenis_surat || "",
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
    quantity: editData?.quantity || 0,
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, tanggal: currentDate });
    }
  };

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
          .from("laporan_bunker_fresh_water")
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
          .from("laporan_bunker_fresh_water")
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

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.tanggal),
      onChange: onChangeDate,
      mode: "date",
    });
  };

  const handleWaktuStartChange = createTimeChangeHandler(
    setFormData,
    "waktu_mulai"
  );
  const handleWaktuSelesaiChange = createTimeChangeHandler(
    setFormData,
    "waktu_selesai"
  );

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
            placeholder="Tempat Bunker"
            value={formData.tempat_bunker}
            onChangeText={(text) =>
              setFormData({ ...formData, tempat_bunker: text })
            }
          />
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal}</Text>
            <Button
              title="Pilih Tanggal"
              onPress={showDatePickerDialog}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu Mulai: {formData.waktu_mulai}</Text>
            <Button
              title="Pilih Waktu Mulai"
              onPress={handleWaktuStartChange}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <View style={styles.dateTimeContainer}>
            <Text>Waktu Selesai: {formData.waktu_selesai}</Text>
            <Button
              title="Pilih Waktu Selesai"
              onPress={handleWaktuSelesaiChange}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <Input
            placeholder="Quantity"
            value={formData.quantity.toString()}
            onChangeText={(number) =>
              setFormData({ ...formData, quantity: number })
            }
          />
          <Input
            placeholder="Keterangan"
            value={formData.keterangan}
            onChangeText={(text) =>
              setFormData({ ...formData, keterangan: text })
            }
          />
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

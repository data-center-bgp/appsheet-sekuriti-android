import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/themed";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { generateUUID, generateDataID } from "../utils/uuid";

export default function BarangKeluarCreate() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "BarangKeluarCreate">>();
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
    kurir: editData?.kurir || "",
    nama_pemilik_barang: editData?.nama_pemilik_barang || "",
    tujuan: editData?.tujuan || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
    pos: editData?.pos || "",
    file_pdf: editData?.file_pdf || "",
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

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentTime = selectedTime.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      });
      setFormData({ ...formData, jam: currentTime });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formattedId = generateDataID();
      const recordId = formData.id || generateUUID();

      console.log("Record ID:", recordId);
      console.log("Generated IDs:", { formattedId, recordId });

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
          .from("barang_keluar")
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
          .from("barang_keluar")
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

  const showTimePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.jam),
      onChange: onChangeTime,
      mode: "time",
      is24Hour: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Card containerStyle={styles.card}>
          <Card.Title>
            {editData ? "Edit Data Barang Keluar" : "Tambah Data Barang Keluar"}
          </Card.Title>
          <Card.Divider />
          <Input
            placeholder="Nomor DO"
            value={formData.nomor_do}
            onChangeText={(text) =>
              setFormData({ ...formData, nomor_do: text })
            }
            errorMessage={!formData.nomor_do ? "Nomor DO harus diisi" : ""}
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
            <Text>Jam: {formData.jam}</Text>
            <Button
              title="Pilih Jam"
              onPress={showTimePickerDialog}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <Input
            placeholder="Nama Pembawa Barang"
            value={formData.kurir}
            onChangeText={(text) => setFormData({ ...formData, kurir: text })}
          />
          <Input
            placeholder="Nama Pemilik Barang"
            value={formData.nama_pemilik_barang}
            onChangeText={(text) =>
              setFormData({ ...formData, nama_pemilik_barang: text })
            }
          />
          <Input
            placeholder="Tujuan"
            value={formData.tujuan}
            onChangeText={(text) => setFormData({ ...formData, tujuan: text })}
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
          <Input
            placeholder="Pos"
            value={formData.pos}
            onChangeText={(text) => setFormData({ ...formData, pos: text })}
          />
          <Input
            placeholder="File PDF"
            value={formData.file_pdf}
            onChangeText={(text) =>
              setFormData({ ...formData, file_pdf: text })
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

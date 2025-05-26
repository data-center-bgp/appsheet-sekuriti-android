import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/base";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { generateUUID, generateDataID } from "../utils/uuid";

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
    quantity: editData?.quantity || 0,
    tujuan: editData?.tujuan || "",
    approved_by: editData?.approved_by || "",
    surat_jalan: editData?.surat_jalan || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
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
          .from("laporan_mobil_tangki_fuel")
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
          .from("laporan_mobil_tangki_fuel")
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Card containerStyle={styles.card}>
          <Card.Title>{editData ? "Edit Data" : "Tambah Data Baru"}</Card.Title>
          <Card.Divider />
          <View style={styles.dateTimeContainer}>
            <Text>Tanggal: {formData.tanggal}</Text>
            <Button
              title="Pilih Tanggal"
              onPress={showDatePickerDialog}
              type="outline"
              buttonStyle={styles.dateTimeButton}
            />
          </View>
          <Input
            placeholder="Nama Driver"
            value={formData.nama_driver}
            onChangeText={(text) =>
              setFormData({ ...formData, nama_driver: text })
            }
          />
          <Input
            placeholder="Quantity"
            value={formData.quantity.toString()}
            onChangeText={(number) =>
              setFormData({ ...formData, quantity: number })
            }
          />
          <Input
            placeholder="Tujuan"
            value={formData.tujuan}
            onChangeText={(text) =>
              setFormData({ ...formData, quantity: text })
            }
          />
          <Input
            placeholder="Approved by"
            value={formData.approved_by}
            onChangeText={(text) =>
              setFormData({ ...formData, approved_by: text })
            }
          />
          <Input
            placeholder="Surat Jalan"
            value={formData.surat_jalan}
            onChangeText={(text) =>
              setFormData({ ...formData, surat_jalan: text })
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

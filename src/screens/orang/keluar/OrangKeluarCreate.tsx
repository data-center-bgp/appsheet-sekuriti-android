import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/base";
import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../../types/navigation";
import { generateUUID, generateDataID } from "../../../../utils/uuid";

export default function OrangKeluarCreate() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "OrangKeluarCreate">>();
  const editData = route.params?.editData;
  const [formData, setFormData] = useState({
    id: editData?.id || undefined,
    ID: editData?.ID || "",
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    jam:
      editData?.jam ||
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      }),
    id_card: editData?.id_card || "",
    nomor_id_card: editData?.nomor_id_card || "",
    keterangan: editData?.keterangan || "",
    sekuriti: editData?.sekuriti || "",
    pos: editData?.pos || "",
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
          .from("orang_keluar")
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
          .from("orang_keluar")
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
    setShowDatePicker(true);
    DateTimePickerAndroid.open({
      value: new Date(formData.tanggal),
      onChange: onChangeDate,
      mode: "date",
    });
  };

  const showTimePickerDialog = () => {
    setShowTimePicker(true);
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
            placeholder="ID Card"
            value={formData.id_card}
            onChangeText={(text) => setFormData({ ...formData, id_card: text })}
          />
          <Input
            placeholder="Nomor ID Card"
            value={formData.nomor_id_card}
            onChangeText={(text) =>
              setFormData({ ...formData, nomor_id_card: text })
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
          <Input
            placeholder="Pos"
            value={formData.pos}
            onChangeText={(text) => setFormData({ ...formData, pos: text })}
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

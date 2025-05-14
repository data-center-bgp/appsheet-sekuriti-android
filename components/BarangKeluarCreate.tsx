import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, Input } from "@rneui/themed";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { generateUUID, generateNomorDO } from "../utils/uuid";

export default function BarangKeluarCreate() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, "BarangKeluarCreate">>();
    const editData = route.params?.editData;
    const [formData, setFormData] = useState({
        id: editData?.id || undefined,
        ID: editData?.ID || "",
        nomor_do: editData?.nomor_do || "",
        tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
        jam: editData?.jam || new Date().toLocaleTimeString("en-US"), {
            hour12: false,
            timeZone: "Asia/Singapore",
        }
    })
}
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
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import DropdownSelector from "../../../components/DropdownSelector";
import { useUserBusinessUnit } from "../../../hooks/useUserBusinessUnit";
import { useSecurityOptions } from "../../../hooks/useSecurityNames";
import { useTravoBlowerMaster } from "../../../hooks/useTravoBlowerMaster";
import {
  createTimeChangeHandler,
  openTimePicker,
} from "../../../utils/timeHandler";
import {
  validateChecklist,
  buildCheckRows,
  ChecklistEntry,
  Kondisi,
} from "../../../utils/travoBlowerChecklist";

export default function LaporanTravoBlowerCreate() {
  const navigation = useNavigation();

  const { businessUnit, loading: businessUnitLoading } = useUserBusinessUnit();
  const {
    items: masterItems,
    loading: masterLoading,
    error: masterError,
  } = useTravoBlowerMaster(businessUnit);
  const { dropdownOptions: securityOptions, loading: securityLoading } =
    useSecurityOptions(businessUnit);

  const [header, setHeader] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    jam: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "Asia/Singapore",
    }),
    sekuriti: "",
  });

  const [entries, setEntries] = useState<Record<string, ChecklistEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const setKondisi = (id: string, kondisi: Kondisi) => {
    setEntries((prev) => ({
      ...prev,
      [id]: { kondisi, keterangan: prev[id]?.keterangan || "" },
    }));
  };

  const setKeterangan = (id: string, keterangan: string) => {
    setEntries((prev) => ({
      ...prev,
      [id]: { kondisi: prev[id]?.kondisi ?? null, keterangan },
    }));
  };

  const onChangeTime = createTimeChangeHandler(setHeader, "jam");

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(header.tanggal),
      onChange: (_e, selectedDate?: Date) => {
        if (selectedDate) {
          setHeader((prev) => ({
            ...prev,
            tanggal: selectedDate.toISOString().split("T")[0],
          }));
        }
      },
      mode: "date",
    });
  };

  const showTimePickerDialog = () => {
    try {
      const [h, m] = header.jam.split(":");
      const d = new Date();
      d.setHours(parseInt(h) || 0);
      d.setMinutes(parseInt(m) || 0);
      d.setSeconds(0);
      openTimePicker(d, onChangeTime);
    } catch {
      openTimePicker(new Date(), onChangeTime);
    }
  };

  const validation = validateChecklist(masterItems, entries, header);

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!validation.valid) {
      if (validation.noItems) {
        setError("Tidak ada item travo/blower untuk business unit ini");
      } else if (validation.sekuritiMissing) {
        setError("Pilih nama sekuriti terlebih dahulu");
      } else {
        setError(
          `Masih ada ${validation.unselectedIds.length} item yang belum ditandai`
        );
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      const rows = buildCheckRows(masterItems, entries, header);
      const { error: insertError } = await supabase
        .from("travo_blower_checks")
        .insert(rows);
      if (insertError) throw insertError;

      Alert.alert("Berhasil", "Checklist berhasil disimpan", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <Icon name={icon} type="feather" size={20} color="#20c997" />
        <View style={styles.dateTimeText}>
          <Text style={styles.dateTimeLabel}>{label}</Text>
          <Text style={styles.dateTimeValue}>{value}</Text>
        </View>
        <Icon name="chevron-right" type="feather" size={20} color="#6c757d" />
      </View>
    </TouchableOpacity>
  );

  const initialLoading = businessUnitLoading || masterLoading;

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Checklist Travo Blower",
            style: { color: "white", fontSize: 18, fontWeight: "bold" },
          }}
          leftComponent={{
            icon: "arrow-left",
            type: "feather",
            color: "white",
            onPress: () => navigation.goBack(),
          }}
          backgroundColor="#20c997"
          barStyle="light-content"
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" type="feather" size={32} color="#20c997" />
          <Text style={styles.loadingText}>Memuat data checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: "Checklist Travo Blower",
          style: { color: "white", fontSize: 18, fontWeight: "bold" },
        }}
        leftComponent={{
          icon: "arrow-left",
          type: "feather",
          color: "white",
          onPress: () => navigation.goBack(),
        }}
        backgroundColor="#20c997"
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
          <View style={styles.formHeader}>
            <Icon
              name="check-square"
              type="feather"
              size={32}
              color="#20c997"
              containerStyle={styles.headerIcon}
            />
            <Text style={styles.formTitle}>Checklist Travo/Blower</Text>
            <Text style={styles.formSubtitle}>
              Tandai kondisi tiap unit: Baik atau Rusak
            </Text>
            {businessUnit && (
              <View style={styles.businessUnitInfo}>
                <Icon
                  name="building"
                  type="font-awesome-5"
                  size={16}
                  color="#20c997"
                />
                <Text style={styles.businessUnitText}>
                  Business Unit: {businessUnit}
                </Text>
              </View>
            )}
          </View>

          {/* Header sesi */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="info" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Sesi</Text>
            </View>
            <View style={styles.timeGrid}>
              <DateTimeSelector
                label="Tanggal"
                value={header.tanggal}
                onPress={showDatePickerDialog}
                icon="calendar"
              />
              <DateTimeSelector
                label="Jam"
                value={header.jam}
                onPress={showTimePickerDialog}
                icon="clock"
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <DropdownSelector
                label="Sekuriti *"
                placeholder="Pilih nama sekuriti"
                value={header.sekuriti}
                options={securityOptions}
                onSelect={(value) =>
                  setHeader((prev) => ({ ...prev, sekuriti: value }))
                }
                leftIcon={{
                  name: "shield",
                  type: "feather",
                  size: 20,
                  color: "#6c757d",
                }}
                disabled={securityLoading}
                required
                errorMessage={
                  showValidation && validation.sekuritiMissing
                    ? "Sekuriti wajib dipilih"
                    : undefined
                }
              />
            </View>
          </Card>

          {/* Daftar checklist */}
          {masterError ? (
            <View style={styles.errorContainer}>
              <Icon
                name="alert-circle"
                type="feather"
                size={18}
                color="#dc3545"
              />
              <Text style={styles.errorText}>Error memuat item: {masterError}</Text>
            </View>
          ) : masterItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="inbox" type="feather" size={40} color="#6c757d" />
              <Text style={styles.emptyText}>
                Belum ada master travo/blower untuk business unit ini
              </Text>
            </View>
          ) : (
            masterItems.map((item) => {
              const entry = entries[item.id];
              const unselected =
                showValidation && (entry?.kondisi ?? null) === null;
              return (
                <Card
                  key={item.id}
                  containerStyle={[
                    styles.card,
                    unselected ? styles.cardInvalid : null,
                  ]}
                >
                  <Text style={styles.itemTitle}>{item.jenis}</Text>
                  <View style={styles.kondisiRow}>
                    <TouchableOpacity
                      style={[
                        styles.kondisiBtn,
                        entry?.kondisi === "Baik"
                          ? styles.kondisiBaikActive
                          : null,
                      ]}
                      onPress={() => setKondisi(item.id, "Baik")}
                    >
                      <Icon
                        name="check-circle"
                        type="feather"
                        size={16}
                        color={entry?.kondisi === "Baik" ? "white" : "#20c997"}
                      />
                      <Text
                        style={[
                          styles.kondisiText,
                          entry?.kondisi === "Baik"
                            ? styles.kondisiTextActive
                            : { color: "#20c997" },
                        ]}
                      >
                        Baik
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.kondisiBtn,
                        entry?.kondisi === "Rusak"
                          ? styles.kondisiRusakActive
                          : null,
                      ]}
                      onPress={() => setKondisi(item.id, "Rusak")}
                    >
                      <Icon
                        name="x-circle"
                        type="feather"
                        size={16}
                        color={entry?.kondisi === "Rusak" ? "white" : "#dc3545"}
                      />
                      <Text
                        style={[
                          styles.kondisiText,
                          entry?.kondisi === "Rusak"
                            ? styles.kondisiTextActive
                            : { color: "#dc3545" },
                        ]}
                      >
                        Rusak
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    placeholder="Keterangan (opsional)"
                    value={entry?.keterangan || ""}
                    onChangeText={(text) => setKeterangan(item.id, text)}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={{ paddingHorizontal: 0, marginTop: 8 }}
                  />
                </Card>
              );
            })
          )}

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
              disabled={loading || masterItems.length === 0}
              buttonStyle={styles.submitButton}
              titleStyle={styles.submitButtonText}
              loading={loading}
              containerStyle={styles.buttonContainer}
              icon={
                loading
                  ? undefined
                  : { name: "save", type: "feather", color: "white", size: 18 }
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: { fontSize: 16, color: "#6c757d", marginTop: 16 },
  formHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerIcon: {
    backgroundColor: "#c6f7d6",
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
  formSubtitle: { fontSize: 14, color: "#6c757d", textAlign: "center" },
  businessUnitInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#c6f7d6",
    borderRadius: 6,
    gap: 6,
  },
  businessUnitText: { fontSize: 12, color: "#0d5d2a", fontWeight: "500" },
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
  cardInvalid: { borderWidth: 1, borderColor: "#dc3545" },
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
  timeGrid: { flexDirection: "row", gap: 12 },
  dateTimeCard: {
    flex: 1,
    backgroundColor: "#c6f7d6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  dateTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  dateTimeText: { flex: 1, marginLeft: 8 },
  dateTimeLabel: { fontSize: 12, color: "#6c757d", marginBottom: 2 },
  dateTimeValue: { fontSize: 14, fontWeight: "500", color: "#212529" },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  kondisiRow: { flexDirection: "row", gap: 12 },
  kondisiBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "white",
  },
  kondisiBaikActive: { backgroundColor: "#20c997", borderColor: "#20c997" },
  kondisiRusakActive: { backgroundColor: "#dc3545", borderColor: "#dc3545" },
  kondisiText: { fontSize: 14, fontWeight: "600" },
  kondisiTextActive: { color: "white" },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 4,
  },
  emptyBox: {
    alignItems: "center",
    padding: 32,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 12,
    textAlign: "center",
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
  errorText: { color: "#721c24", marginLeft: 8, flex: 1, fontSize: 14 },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  buttonContainer: { flex: 1 },
  cancelButton: {
    borderColor: "#6c757d",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    height: 48,
  },
  cancelButtonText: { color: "#6c757d", fontWeight: "600" },
  submitButton: { backgroundColor: "#20c997", borderRadius: 8, height: 48 },
  submitButtonText: { fontWeight: "600", marginLeft: 8 },
});

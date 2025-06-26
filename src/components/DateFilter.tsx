import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Text, Button, Icon } from "@rneui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

export interface DateFilterState {
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

interface DateFilterProps {
  value: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  themeColor?: string;
  style?: any;
}

export default function DateFilter({
  value,
  onChange,
  themeColor = "#007bff",
  style,
}: DateFilterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempFilter, setTempFilter] = useState<DateFilterState>(value);

  const formatDate = (date: Date | null) => {
    if (!date) return "Pilih tanggal";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openModal = () => {
    setTempFilter(value);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const applyFilter = () => {
    onChange(tempFilter);
    closeModal();
  };

  const resetFilter = () => {
    const resetState = {
      startDate: null,
      endDate: null,
      isActive: false,
    };
    setTempFilter(resetState);
    onChange(resetState);
    closeModal();
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      setTempFilter({
        ...tempFilter,
        startDate: selectedDate,
        isActive: true,
      });
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      setTempFilter({
        ...tempFilter,
        endDate: selectedDate,
        isActive: true,
      });
    }
  };

  const getFilterText = () => {
    if (!value.isActive) return "Filter Tanggal";

    if (value.startDate && value.endDate) {
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;
    } else if (value.startDate) {
      return `Dari ${formatDate(value.startDate)}`;
    } else if (value.endDate) {
      return `Sampai ${formatDate(value.endDate)}`;
    }

    return "Filter Tanggal";
  };

  return (
    <View style={[styles.container, style]}>
      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          { borderColor: value.isActive ? themeColor : "#dee2e6" },
          value.isActive && { backgroundColor: `${themeColor}15` },
        ]}
        onPress={openModal}
      >
        <Icon
          name="calendar"
          type="feather"
          size={16}
          color={value.isActive ? themeColor : "#6c757d"}
        />
        <Text
          style={[
            styles.filterButtonText,
            { color: value.isActive ? themeColor : "#6c757d" },
          ]}
          numberOfLines={1}
        >
          {getFilterText()}
        </Text>
        {value.isActive && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              resetFilter();
            }}
            style={styles.clearButton}
          >
            <Icon name="x" type="feather" size={14} color={themeColor} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tanggal</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" type="feather" size={24} color="#495057" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Start Date */}
              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Tanggal Mulai</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: themeColor }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Icon
                    name="calendar"
                    type="feather"
                    size={16}
                    color={themeColor}
                  />
                  <Text
                    style={[
                      styles.dateButtonText,
                      tempFilter.startDate && { color: "#212529" },
                    ]}
                  >
                    {formatDate(tempFilter.startDate)}
                  </Text>
                </TouchableOpacity>
                {tempFilter.startDate && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() =>
                      setTempFilter({ ...tempFilter, startDate: null })
                    }
                  >
                    <Text style={[styles.clearDateText, { color: themeColor }]}>
                      Hapus
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* End Date */}
              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Tanggal Akhir</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: themeColor }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Icon
                    name="calendar"
                    type="feather"
                    size={16}
                    color={themeColor}
                  />
                  <Text
                    style={[
                      styles.dateButtonText,
                      tempFilter.endDate && { color: "#212529" },
                    ]}
                  >
                    {formatDate(tempFilter.endDate)}
                  </Text>
                </TouchableOpacity>
                {tempFilter.endDate && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() =>
                      setTempFilter({ ...tempFilter, endDate: null })
                    }
                  >
                    <Text style={[styles.clearDateText, { color: themeColor }]}>
                      Hapus
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Filters */}
              <View style={styles.quickFiltersSection}>
                <Text style={styles.quickFiltersTitle}>Filter Cepat</Text>
                <View style={styles.quickFiltersGrid}>
                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      setTempFilter({
                        startDate: today,
                        endDate: today,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      Hari Ini
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      setTempFilter({
                        startDate: yesterday,
                        endDate: yesterday,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      Kemarin
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      setTempFilter({
                        startDate: weekAgo,
                        endDate: today,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      7 Hari Terakhir
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setDate(today.getDate() - 30);
                      setTempFilter({
                        startDate: monthAgo,
                        endDate: today,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      30 Hari Terakhir
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      const firstDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                      );
                      setTempFilter({
                        startDate: firstDay,
                        endDate: today,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      Bulan Ini
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      { borderColor: themeColor },
                    ]}
                    onPress={() => {
                      const today = new Date();
                      const lastMonth = new Date(
                        today.getFullYear(),
                        today.getMonth() - 1,
                        1
                      );
                      const lastDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        0
                      );
                      setTempFilter({
                        startDate: lastMonth,
                        endDate: lastDay,
                        isActive: true,
                      });
                    }}
                  >
                    <Text
                      style={[styles.quickFilterText, { color: themeColor }]}
                    >
                      Bulan Lalu
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <Button
                title="Reset"
                onPress={resetFilter}
                buttonStyle={[styles.resetButton, { borderColor: themeColor }]}
                titleStyle={[styles.resetButtonText, { color: themeColor }]}
                type="outline"
              />
              <Button
                title="Terapkan"
                onPress={applyFilter}
                buttonStyle={[
                  styles.applyButton,
                  { backgroundColor: themeColor },
                ]}
                titleStyle={styles.applyButtonText}
              />
            </View>
          </View>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={tempFilter.startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            maximumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={tempFilter.endDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            maximumDate={new Date()}
            minimumDate={tempFilter.startDate || undefined}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "white",
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    flex: 1,
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flex: 1,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "white",
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: "#6c757d",
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  clearDateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  quickFiltersSection: {
    marginTop: 20,
  },
  quickFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  quickFiltersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "white",
    minWidth: "45%",
    alignItems: "center",
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
    backgroundColor: "white",
    minHeight: 75,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
  },
  resetButtonText: {
    fontWeight: "500",
  },
  applyButton: {
    flex: 1,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

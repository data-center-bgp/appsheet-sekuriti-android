import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { Icon } from "@rneui/themed";
import { DropDownOption } from "../utils/dropdown";

interface DropdownSelectorProps {
  label: string;
  placeholder: string;
  value: string;
  options: DropDownOption[];
  onSelect: (value: string) => void;
  errorMessage?: string;
  leftIcon?: {
    name: string;
    type: string;
    size?: number;
    color?: string;
  };
  disabled?: boolean;
  required?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export default function DropdownSelector({
  label,
  placeholder,
  value,
  options,
  onSelect,
  errorMessage,
  leftIcon,
  disabled = false,
  required = false,
}: DropdownSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setModalVisible(false);
  };

  const renderOption = ({ item }: { item: DropDownOption }) => (
    <TouchableOpacity
      style={[styles.optionItem, item.value === value && styles.selectedOption]}
      onPress={() => handleSelect(item.value)}
    >
      <Text
        style={[
          styles.optionText,
          item.value === value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <Icon name="check" type="feather" size={18} color="#007bff" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.disabledButton,
          errorMessage && styles.errorButton,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          {leftIcon && (
            <Icon
              name={leftIcon.name}
              type={leftIcon.type}
              size={leftIcon.size || 20}
              color={leftIcon.color || "#6c757d"}
              containerStyle={styles.leftIconContainer}
            />
          )}

          <Text
            style={[
              styles.buttonText,
              !selectedOption && styles.placeholderText,
              disabled && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>

          <Icon
            name="chevron-down"
            type="feather"
            size={18}
            color={disabled ? "#adb5bd" : "#6c757d"}
          />
        </View>
      </TouchableOpacity>

      {/* Error Message */}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih {label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="x" type="feather" size={24} color="#495057" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: "#dc3545",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    backgroundColor: "#fff",
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  errorButton: {
    borderColor: "#dc3545",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  placeholderText: {
    color: "#6c757d",
  },
  disabledText: {
    color: "#adb5bd",
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "60%",
    width: screenWidth * 0.9,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  selectedOption: {
    backgroundColor: "#e3f2fd",
  },
  optionText: {
    fontSize: 16,
    color: "#212529",
    flex: 1,
  },
  selectedOptionText: {
    color: "#007bff",
    fontWeight: "500",
  },
});

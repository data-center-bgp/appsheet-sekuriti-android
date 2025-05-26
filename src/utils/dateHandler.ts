import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

/**
 * Creates a date change handler that updates form data with the selected date
 * @param setFormData Function to update form data
 * @param fieldName The field name in the form data to update
 * @returns A function to handle date change events
 */
export const createDateChangeHandler = (
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  fieldName: string = "tanggal"
) => {
  return (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      const currentDate = selectedDate.toISOString().split("T")[0];
      setFormData((prevData: any) => ({
        ...prevData,
        [fieldName]: currentDate,
      }));
    }
  };
};

/**
 * Opens a date picker dialog
 * @param date The initial date to display
 * @param onChange The function to call when a date is selected
 */

export const openDatePicker = (
  date: string | Date,
  onChange: (event: any, date?: Date) => void
) => {
  DateTimePickerAndroid.open({
    value: date instanceof Date ? date : new Date(date),
    onChange,
    mode: "date",
  });
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

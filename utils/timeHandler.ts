import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

/**
 * Creates a time change handler that updates form data with the selected time
 * @param setFormData Function to update form data
 * @param fieldName The field name in the form data to update (jam, waktu_mulai, waktu_selesai, etc.)
 * @returns A function to handle time change events
 */

export const createTimeChangeHandler =
  (
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    fieldName: string = "jam"
  ) =>
  (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const currentTime = selectedTime.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Singapore",
      });
      setFormData((prevData: any) => ({
        ...prevData,
        [fieldName]: currentTime,
      }));
    }
  };

/**
 * Opens a time picker dialog
 * @param time The initial time to display
 * @param onChange The function to call when a time is selected
 */

export const openTimePicker = (
  time: string | Date,
  onChange: (event: any, time?: Date) => void
) => {
  DateTimePickerAndroid.open({
    value: time instanceof Date ? time : new Date(time),
    onChange,
    mode: "time",
    is24Hour: true,
  });
};

export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: "Asia/Singapore",
  });
};

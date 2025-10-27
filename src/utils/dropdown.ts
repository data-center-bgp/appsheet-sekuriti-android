export interface DropDownOption {
  label: string;
  value: string;
}

/**
 * Get the label for a given value from dropdown options
 * @param options Array of dropdown options
 * @param value The value to search for
 * @returns The label if found, otherwise the value itself
 */
export const getOptionLabel = (
  options: DropDownOption[],
  value: string
): string => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
};

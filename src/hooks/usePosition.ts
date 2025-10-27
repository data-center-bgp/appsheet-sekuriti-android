import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface PositionOption {
  label: string;
  value: string;
  businessUnit: string;
}

export const usePosition = (userBusinessUnit: string | null | undefined) => {
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPositionOptions();
  }, [userBusinessUnit]);

  const fetchPositionOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("pos_security")
        .select("pos, business_unit")
        .order("pos", { ascending: true });

      if (userBusinessUnit && userBusinessUnit.toLowerCase() !== "master") {
        query = query.eq("business_unit", userBusinessUnit.toLowerCase());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const options: PositionOption[] = data.map((item) => ({
          label: item.pos,
          value: item.pos,
          businessUnit: item.business_unit,
        }));
        setPositionOptions(options);
      }
    } catch (err: any) {
      console.error("Error fetching position options:", err);
      setError(err.message);
      setPositionOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = () => {
    return positionOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  };

  return {
    positionOptions,
    dropdownOptions: getDropdownOptions(),
    loading,
    error,
    refetch: fetchPositionOptions,
  };
};

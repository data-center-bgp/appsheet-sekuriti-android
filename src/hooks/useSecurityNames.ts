import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface SecurityOption {
  label: string;
  value: string;
  businessUnit: string;
}

export const useSecurityOptions = (
  userBusinessUnit: string | null | undefined
) => {
  const [securityOptions, setSecurityOptions] = useState<SecurityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityOptions();
  }, [userBusinessUnit]);

  const fetchSecurityOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("pic_security")
        .select("nama, business_unit")
        .order("nama", { ascending: true });

      // Filter by business unit if user is not from master
      if (userBusinessUnit && userBusinessUnit.toLowerCase() !== "master") {
        query = query.eq("business_unit", userBusinessUnit.toLowerCase());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const options: SecurityOption[] = data.map((item) => ({
          label: item.nama,
          value: item.nama,
          businessUnit: item.business_unit,
        }));
        setSecurityOptions(options);
      }
    } catch (err: any) {
      console.error("Error fetching security options:", err);
      setError(err.message);
      setSecurityOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = () => {
    return securityOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  };

  return {
    securityOptions,
    dropdownOptions: getDropdownOptions(),
    loading,
    error,
    refetch: fetchSecurityOptions,
  };
};

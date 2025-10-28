import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface CompanyOption {
  label: string;
  value: string;
}

export const useCompanies = () => {
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .order("nama_perusahaan", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const options: CompanyOption[] = data.map((item) => ({
          label: item.nama_perusahaan,
          value: item.nama_perusahaan,
        }));
        setCompanyOptions(options);
      }
    } catch (err: any) {
      console.error("Error fetching companies:", err);
      setError(err.message);
      setCompanyOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = () => {
    return companyOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  };

  return {
    companyOptions,
    dropdownOptions: getDropdownOptions(),
    loading,
    error,
    refetch: fetchCompanies,
  };
};

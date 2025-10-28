import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface VesselOption {
  label: string;
  value: string;
}

export const useVessels = () => {
  const [vesselOptions, setVesselOptions] = useState<VesselOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("vessels")
        .select("*")
        .order("nama_kapal", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const options: VesselOption[] = data.map((item) => ({
          label: item.nama_kapal,
          value: item.nama_kapal,
        }));
        setVesselOptions(options);
      }
    } catch (err: any) {
      console.error("Error fetching vessels:", err);
      setError(err.message);
      setVesselOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = () => {
    return vesselOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  };

  return {
    vesselOptions,
    dropdownOptions: getDropdownOptions(),
    loading,
    error,
    refetch: fetchVessels,
  };
};

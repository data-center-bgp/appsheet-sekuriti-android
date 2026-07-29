import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MasterItem } from "../utils/travoBlowerChecklist";

export const useTravoBlowerMaster = (
  businessUnit: string | null | undefined
) => {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessUnit]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("master_travo_blower")
        .select("id, jenis")
        .order("jenis", { ascending: true });

      // Filter BU kecuali role master (lihat Risiko #1: casing)
      if (businessUnit && businessUnit.toLowerCase() !== "master") {
        query = query.eq("business_unit", businessUnit);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setItems((data || []) as MasterItem[]);
    } catch (err: any) {
      console.error("Error fetching master travo/blower:", err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error, refetch: fetchItems };
};

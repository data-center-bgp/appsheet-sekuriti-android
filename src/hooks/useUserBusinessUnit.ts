import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface UserProfile {
  business_unit: string | null;
}

export const useUserBusinessUnit = () => {
  const [businessUnit, setBusinessUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserBusinessUnit();
  }, []);

  const getUserBusinessUnit = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("No user found");
      }

      // Get user profile with business unit
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("business_unit")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setBusinessUnit(profile?.business_unit || null);
    } catch (err) {
      console.error("Error fetching user business unit:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { businessUnit, loading, error, refetch: getUserBusinessUnit };
};

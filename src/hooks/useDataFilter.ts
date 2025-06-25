import { useMemo } from "react";
import { useUserBusinessUnit } from "./useUserBusinessUnit";

export const useDataFilter = () => {
  const { businessUnit, loading, error } = useUserBusinessUnit();

  const dataFilter = useMemo(() => {
    if (!businessUnit) {
      return null;
    }

    // If user is MASTER, return null (no filter - see all data)
    if (businessUnit.toLowerCase() === "master") {
      return null;
    }

    // For other business units, return filter for their specific unit
    return businessUnit;
  }, [businessUnit]);

  const canSeeAllData = useMemo(() => {
    return businessUnit?.toLowerCase() === "master";
  }, [businessUnit]);

  return {
    businessUnit,
    dataFilter,
    canSeeAllData,
    loading,
    error,
  };
};

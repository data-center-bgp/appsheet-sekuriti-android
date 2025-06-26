import { DateFilterState } from "../components/DateFilter";

export const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
};

export const applyDateFilter = (
  query: any,
  dateFilter: DateFilterState,
  dateField: string = "tanggal"
) => {
  if (!dateFilter.isActive) return query;

  if (dateFilter.startDate && dateFilter.endDate) {
    // Both dates selected - range filter
    const startDate = formatDateForQuery(dateFilter.startDate);
    const endDate = formatDateForQuery(dateFilter.endDate);
    return query.gte(dateField, startDate).lte(dateField, endDate);
  } else if (dateFilter.startDate) {
    // Only start date - from this date onwards
    const startDate = formatDateForQuery(dateFilter.startDate);
    return query.gte(dateField, startDate);
  } else if (dateFilter.endDate) {
    // Only end date - up to this date
    const endDate = formatDateForQuery(dateFilter.endDate);
    return query.lte(dateField, endDate);
  }

  return query;
};

export const getDateFilterSummary = (dateFilter: DateFilterState): string => {
  if (!dateFilter.isActive) return "";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (dateFilter.startDate && dateFilter.endDate) {
    return `Tanggal: ${formatDate(dateFilter.startDate)} - ${formatDate(
      dateFilter.endDate
    )}`;
  } else if (dateFilter.startDate) {
    return `Dari: ${formatDate(dateFilter.startDate)}`;
  } else if (dateFilter.endDate) {
    return `Sampai: ${formatDate(dateFilter.endDate)}`;
  }

  return "";
};

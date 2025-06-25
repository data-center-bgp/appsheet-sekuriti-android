import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Apply business unit filter to Supabase query
 * @param query Supabase query builder
 * @param businessUnitFilter Business unit filter (null for master users)
 * @param columnName Column name for business unit (default: 'business_unit')
 * @returns Modified query with business unit filter applied
 */
export const applyBusinessUnitFilter = <T extends Record<string, unknown>>(
  query: PostgrestFilterBuilder<any, T, any>,
  businessUnitFilter: string | null,
  columnName: string = "business_unit"
): PostgrestFilterBuilder<any, T, any> => {
  // If no filter (master user), return query as-is
  if (!businessUnitFilter) {
    return query;
  }

  // Apply business unit filter
  return query.eq(columnName as any, businessUnitFilter);
};

/**
 * Create where clause for business unit filtering
 * @param businessUnitFilter Business unit filter (null for master users)
 * @param columnName Column name for business unit (default: 'business_unit')
 * @returns Object with filter conditions or empty object
 */
export const createBusinessUnitFilter = (
  businessUnitFilter: string | null,
  columnName: string = "business_unit"
): Record<string, any> => {
  if (!businessUnitFilter) {
    return {};
  }

  return {
    [columnName]: businessUnitFilter,
  };
};

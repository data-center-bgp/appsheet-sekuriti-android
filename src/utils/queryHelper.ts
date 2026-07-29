/**
 * Apply business unit filter to a Supabase query.
 *
 * Kept generic over the query-builder type `Q` (instead of importing
 * `PostgrestFilterBuilder`) so it stays compatible across
 * @supabase/postgrest-js versions — that class's generic arity has changed
 * between releases, which previously broke this file on upgrade. Callers get
 * back exactly the query type they passed in, so chaining still type-checks.
 *
 * @param query Supabase query builder
 * @param businessUnitFilter Business unit filter (null for master users)
 * @param columnName Column name for business unit (default: 'business_unit')
 * @returns Modified query with business unit filter applied
 */
export const applyBusinessUnitFilter = <Q>(
  query: Q,
  businessUnitFilter: string | null,
  columnName: string = "business_unit"
): Q => {
  // If no filter (master user), return query as-is
  if (!businessUnitFilter) {
    return query;
  }

  // Apply business unit filter. `.eq()` returns the same builder instance,
  // so casting back to `Q` preserves the caller's type.
  return (query as { eq: (column: string, value: string) => Q }).eq(
    columnName,
    businessUnitFilter
  );
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

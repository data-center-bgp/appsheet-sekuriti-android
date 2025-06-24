export interface DropDownOption {
  label: string;
  value: string;
}

export interface SecurityOption extends DropDownOption {
  businessUnit: string;
}

export interface PosOption extends DropDownOption {
  businessUnit: string;
}

export const POS_OPTIONS: PosOption[] = [
  {
    label: "POS PORTAL SHIPYARD",
    value: "POS PORTAL SHIPYARD",
    businessUnit: "shipyard",
  },
  {
    label: "POS LAUT SHIPYARD",
    value: "POS LAUT SHIPYARD",
    businessUnit: "shipyard",
  },
  {
    label: "POS DEPOT FUEL",
    value: "POS DEPOT FUEL",
    businessUnit: "shipyard",
  },
  {
    label: "POS PORTAL SHOREBASE",
    value: "POS PORTAL SHOREBASE",
    businessUnit: "shorebase",
  },
  {
    label: "POS LAUT SHOREBASE",
    value: "POS LAUT SHOREBASE",
    businessUnit: "shorebase",
  },
  {
    label: "POS SECURITY TST KUTAI KARTANEGARA",
    value: "POS SECURITY TST KUTAI KARTANEGARA",
    businessUnit: "tst",
  },
  {
    label: "POS SECURITY TST BERAU",
    value: "POS SECURITY TST BERAU",
    businessUnit: "tst",
  },
  {
    label: "POS SECURITY TST TIMIKA",
    value: "POS SECURITY TST TIMIKA",
    businessUnit: "tst",
  },
];

export const SECURITY_OPTIONS: SecurityOption[] = [
  // Shipyard Security Personnel
  { label: "SUPARDI", value: "SUPARDI", businessUnit: "shipyard" },
  {
    label: "NOVIANSYAH NUR",
    value: "NOVIANSYAH NUR",
    businessUnit: "shipyard",
  },
  { label: "HENDRIAN NUR", value: "HENDRIAN NUR", businessUnit: "shipyard" },
  { label: "SUGIYONO", value: "SUGIYONO", businessUnit: "shipyard" },
  { label: "AMIN", value: "AMIN", businessUnit: "shipyard" },
  { label: "SUSANTO", value: "SUSANTO", businessUnit: "shipyard" },
  { label: "BUDIANTO", value: "BUDIANTO", businessUnit: "shipyard" },
  { label: "ABDUL SYUKUR", value: "ABDUL SYUKUR", businessUnit: "shipyard" },
  { label: "KHAIRUL AQRAM", value: "KHAIRUL AQRAM", businessUnit: "shipyard" },
  {
    label: "RIZQI ADE SYAHPUTRA",
    value: "RIZQI ADE SYAHPUTRA",
    businessUnit: "shipyard",
  },
  { label: "SURATMIN", value: "SURATMIN", businessUnit: "shipyard" },
  { label: "SARJIYO", value: "SARJIYO", businessUnit: "shipyard" },
  { label: "MUH. HISAM", value: "MUH. HISAM", businessUnit: "shipyard" },
  {
    label: "ISTAT ISKANDAR",
    value: "ISTAT ISKANDAR",
    businessUnit: "shipyard",
  },
  { label: "M. RIZAL", value: "M. RIZAL", businessUnit: "shipyard" },
  { label: "ANWAR", value: "ANWAR", businessUnit: "shipyard" },
  { label: "MUHIDDIN", value: "MUHIDDIN", businessUnit: "shipyard" },
  { label: "ABDUL MUIN", value: "ABDUL MUIN", businessUnit: "shipyard" },
  { label: "ANTONIUS", value: "ANTONIUS", businessUnit: "shipyard" },
  { label: "EDWIN M. TH.", value: "EDWIN M. TH.", businessUnit: "shipyard" },
  { label: "ERLAND", value: "ERLAND", businessUnit: "shipyard" },
  { label: "FACQIH", value: "FACQIH", businessUnit: "shipyard" },
  { label: "FANANI", value: "FANANI", businessUnit: "shipyard" },
  { label: "SAPARUDIN", value: "SAPARUDIN", businessUnit: "shipyard" },
  { label: "MUAWAL", value: "MUAWAL", businessUnit: "shipyard" },
  { label: "SUPRIANSYAH", value: "SUPRIANSYAH", businessUnit: "shipyard" },
  // Shorebase Security Personnel
  { label: "HERLIANTO", value: "HERLIANTO", businessUnit: "shorebase" },
  { label: "SAMSU", value: "SAMSU", businessUnit: "shorebase" },
  { label: "ARDIANSYAH", value: "ARDIANSYAH", businessUnit: "shorebase" },
  { label: "ERWANSYAH", value: "ERWANSYAH", businessUnit: "shorebase" },
  { label: "SOPIAN N", value: "SOPIAN N", businessUnit: "shorebase" },
  { label: "SAIIN", value: "SAIIN", businessUnit: "shorebase" },
  {
    label: "AHMAD TEDI YUSUF",
    value: "AHMAD TEDI YUSUF",
    businessUnit: "shorebase",
  },
  { label: "ALFREZA", value: "ALFREZA", businessUnit: "shorebase" },
  {
    label: "RAHMAT HIDAYAT",
    value: "RAHMAT HIDAYAT",
    businessUnit: "shorebase",
  },
  { label: "MAHARUDDIN", value: "MAHARUDDIN", businessUnit: "shorebase" },
  { label: "FIQRI HIDAYAT", value: "FIQRI HIDAYAT", businessUnit: "shorebase" },
  { label: "USMAN", value: "USMAN", businessUnit: "shorebase" },
  { label: "IRWANSYAH", value: "IRWANSYAH", businessUnit: "shorebase" },
  { label: "ASA DUL USUD", value: "ASA DUL USUD", businessUnit: "shorebase" },
  {
    label: "MUHAMMAD RAFLI",
    value: "MUHAMMAD RAFLI",
    businessUnit: "shorebase",
  },
  {
    label: "M. IRVAN RAMADHAN",
    value: "M. IRVAN RAMADHAN",
    businessUnit: "shorebase",
  },
  { label: "CHANDRA", value: "CHANDRA", businessUnit: "shorebase" },
  {
    label: "M. ALDI RAHMAN",
    value: "M. ALDI RAHMAN",
    businessUnit: "shorebase",
  },
  {
    label: "M. SYAHRIL ARI SAHPUTRA",
    value: "M. SYAHRIL ARI SAHPUTRA",
    businessUnit: "shorebase",
  },
  { label: "DAVID", value: "DAVID", businessUnit: "shorebase" },
  { label: "YOGI IRAWAN", value: "YOGI IRAWAN", businessUnit: "shorebase" },
  { label: "FAUZAN", value: "FAUZAN", businessUnit: "shorebase" },
  {
    label: "ERLY RAHMANSYAH",
    value: "ERLY RAHMANSYAH",
    businessUnit: "shorebase",
  },
  { label: "SIDIQ", value: "SIDIQ", businessUnit: "shorebase" },
  { label: "RENDIANSYAH", value: "RENDIANSYAH", businessUnit: "shorebase" },
  { label: "SYAHWAL", value: "SYAHWAL", businessUnit: "shorebase" },
  {
    label: "A. SIMANJUNTAK",
    value: "A. SIMANJUNTAK",
    businessUnit: "shorebase",
  },
  { label: "ACHMAD SOFYAN", value: "ACHMAD SOFYAN", businessUnit: "shorebase" },
  { label: "LUBIS", value: "LUBIS", businessUnit: "shorebase" },
  { label: "ABDUL RIYO", value: "ABDUL RIYO", businessUnit: "shorebase" },
  { label: "HAMDANI", value: "HAMDANI", businessUnit: "shorebase" },
  { label: "BAGUS", value: "BAGUS", businessUnit: "shorebase" },
  { label: "ALDI", value: "ALDI", businessUnit: "shorebase" },
  { label: "ARIF", value: "ARIF", businessUnit: "shorebase" },
  {
    label: "BAGUS SETYAWAN",
    value: "BAGUS SETYAWAN",
    businessUnit: "shorebase",
  },
  { label: "MEYLANDRI", value: "MEYLANDRI", businessUnit: "shorebase" },
  { label: "MELANDRY", value: "MELANDRY", businessUnit: "shorebase" },
  { label: "RUSTAN", value: "RUSTAN", businessUnit: "shorebase" },
  {
    label: "FIRMAN MAULANA",
    value: "FIRMAN MAULANA",
    businessUnit: "shorebase",
  },
  { label: "FIRMANSYAH", value: "FIRMANSYAH", businessUnit: "shorebase" },
  { label: "BUDIMAN", value: "BUDIMAN", businessUnit: "shorebase" },
  { label: "RIZANI", value: "RIZANI", businessUnit: "shorebase" },
  { label: "ADI", value: "ADI", businessUnit: "shorebase" },
  { label: "MARZUKI", value: "MARZUKI", businessUnit: "shorebase" },
  { label: "AMIRUDDIN", value: "AMIRUDDIN", businessUnit: "shorebase" },
  { label: "ILHAM", value: "ILHAM", businessUnit: "shorebase" },
  // TST Security Personnel
  { label: "ABDUL GOFUR", value: "ABDUL GOFUR", businessUnit: "tst" },
];

export const getOptionLabel = (
  options: DropDownOption[],
  value: string
): string => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
};

/**
 * Filter security options based on user's business unit
 * @param userBusinessUnit User's business unit (master, shipyard, shorebase, tst)
 * @returns Filtered security options
 */
export const getSecurityOptionsByBusinessUnit = (
  userBusinessUnit: string | null | undefined
): SecurityOption[] => {
  if (!userBusinessUnit) return [];

  // If user is from master business unit, show all security personnel
  if (userBusinessUnit.toLowerCase() === "master") {
    return SECURITY_OPTIONS;
  }

  // Filter by specific business unit
  return SECURITY_OPTIONS.filter(
    (option) =>
      option.businessUnit.toLowerCase() === userBusinessUnit.toLowerCase()
  );
};

/**
 * Get security options as simple DropDownOption array
 * @param userBusinessUnit User's business unit
 * @returns Simple dropdown options
 */
export const getSecurityDropdownOptions = (
  userBusinessUnit: string | null | undefined
): DropDownOption[] => {
  const securityOptions = getSecurityOptionsByBusinessUnit(userBusinessUnit);
  return securityOptions.map((option) => ({
    label: option.label,
    value: option.value,
  }));
};

/**
 * Filter POS options based on user's business unit
 * @param userBusinessUnit User's business unit (master, shipyard, shorebase, tst)
 * @returns Filtered POS options
 */
export const getPosOptionsByBusinessUnit = (
  userBusinessUnit: string | null | undefined
): PosOption[] => {
  if (!userBusinessUnit) return [];

  // If user is from master business unit, show all POS locations
  if (userBusinessUnit.toLowerCase() === "master") {
    return POS_OPTIONS;
  }

  // Filter by specific business unit
  return POS_OPTIONS.filter(
    (option) =>
      option.businessUnit.toLowerCase() === userBusinessUnit.toLowerCase()
  );
};

/**
 * Get POS options as simple DropDownOption array
 * @param userBusinessUnit User's business unit
 * @returns Simple dropdown options
 */
export const getPosDropdownOptions = (
  userBusinessUnit: string | null | undefined
): DropDownOption[] => {
  const posOptions = getPosOptionsByBusinessUnit(userBusinessUnit);
  return posOptions.map((option) => ({
    label: option.label,
    value: option.value,
  }));
};

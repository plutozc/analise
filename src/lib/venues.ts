export type VenueRule = [RegExp, string];

export const VENUE_RULES: VenueRule[] = [
  [/SIGCOMM/i,       "SIGCOMM"],
  [/NSDI/i,          "NSDI"],
  [/IMC\b/i,         "IMC"],
  [/OSDI/i,          "OSDI"],
  [/SOSP/i,          "SOSP"],
  [/CoNEXT/i,        "CoNEXT"],
  [/INFOCOM/i,       "INFOCOM"],
  [/ICNP/i,          "ICNP"],
  [/HOTNETS|HotNets|Hotnets/i, "HOTNETS"],
  [/MOBICOM|MobiCom/i, "MOBICOM"],
  [/SIGMETRICS/i,    "SIGMETRICS"],
  [/EuroSys/i,       "EuroSys"],
  [/ASPLOS/i,        "ASPLOS"],
  [/CCS\b/i,         "CCS"],
  [/S&P|SP\b/i,      "S&P"],
  [/USENIX.*Security|Security.*USENIX/i, "USENIX Security"],
  [/\bATC\b/i,       "ATC"],
  [/\bFAST\b/i,      "FAST"],
  [/PPoPP/i,         "PPoPP"],
  [/\bISCA\b/i,      "ISCA"],
  [/\bMICRO\b/i,     "MICRO"],
  [/\bHPCA\b/i,      "HPCA"],
  [/APNet/i,         "APNet"],
  [/\bANCS\b/i,      "ANCS"],
  [/\bPAM\b/i,       "PAM"],
  [/\bTMA\b/i,       "TMA"],
  [/Middleware/i,    "Middleware"],
  [/SenSys/i,        "SenSys"],
  [/MobiSys/i,       "MobiSys"],
];

export function journalRefToVenue(journalRef: string | null): string {
  if (!journalRef) return "arXiv";
  for (const [re, name] of VENUE_RULES) {
    if (re.test(journalRef)) return name;
  }
  return "arXiv";
}

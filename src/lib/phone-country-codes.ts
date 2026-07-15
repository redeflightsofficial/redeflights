export type PhoneCountryCode = {
  country: string;
  code: string;
};

export const DEFAULT_PHONE_COUNTRY_CODE = "+971";

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { country: "UAE", code: "+971" },
  { country: "India", code: "+91" },
  { country: "United Kingdom", code: "+44" },
  { country: "United States", code: "+1" },
  { country: "Canada", code: "+1" },
  { country: "Saudi Arabia", code: "+966" },
  { country: "Qatar", code: "+974" },
  { country: "Kuwait", code: "+965" },
  { country: "Bahrain", code: "+973" },
  { country: "Oman", code: "+968" },
  { country: "Pakistan", code: "+92" },
  { country: "Bangladesh", code: "+880" },
  { country: "Philippines", code: "+63" },
  { country: "Egypt", code: "+20" },
  { country: "South Africa", code: "+27" },
  { country: "Australia", code: "+61" },
  { country: "Germany", code: "+49" },
  { country: "France", code: "+33" },
  { country: "Italy", code: "+39" },
  { country: "Spain", code: "+34" },
  { country: "Turkey", code: "+90" },
  { country: "Malaysia", code: "+60" },
  { country: "Singapore", code: "+65" },
  { country: "China", code: "+86" },
  { country: "Japan", code: "+81" },
  { country: "Russia", code: "+7" },
  { country: "Sri Lanka", code: "+94" },
  { country: "Nepal", code: "+977" },
  { country: "Indonesia", code: "+62" },
  { country: "Thailand", code: "+66" },
];

export function formatPhoneWithCountryCode(countryCode: string, phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return `${countryCode} ${digits}`;
}

interface MangaLanguage {
  name: string;
  flag: string;
}

const LANGUAGES: Record<string, MangaLanguage> = {
  ar: { name: "Arabic", flag: "🇸🇦" },
  bn: { name: "Bengali", flag: "🇧🇩" },
  bg: { name: "Bulgarian", flag: "🇧🇬" },
  my: { name: "Burmese", flag: "🇲🇲" },
  ca: { name: "Catalan", flag: "🇪🇸" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  "zh-hk": { name: "Chinese (Hong Kong)", flag: "🇭🇰" },
  cs: { name: "Czech", flag: "🇨🇿" },
  da: { name: "Danish", flag: "🇩🇰" },
  de: { name: "German", flag: "🇩🇪" },
  el: { name: "Greek", flag: "🇬🇷" },
  en: { name: "English", flag: "🇺🇸" },
  es: { name: "Spanish", flag: "🇪🇸" },
  "es-la": { name: "Latin American Spanish", flag: "🇲🇽" },
  fa: { name: "Persian", flag: "🇮🇷" },
  fi: { name: "Finnish", flag: "🇫🇮" },
  fr: { name: "French", flag: "🇫🇷" },
  he: { name: "Hebrew", flag: "🇮🇱" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  hu: { name: "Hungarian", flag: "🇭🇺" },
  id: { name: "Indonesian", flag: "🇮🇩" },
  it: { name: "Italian", flag: "🇮🇹" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  jv: { name: "Javanese", flag: "🇮🇩" },
  ko: { name: "Korean", flag: "🇰🇷" },
  la: { name: "Latin", flag: "🇻🇦" },
  lt: { name: "Lithuanian", flag: "🇱🇹" },
  ms: { name: "Malay", flag: "🇲🇾" },
  mn: { name: "Mongolian", flag: "🇲🇳" },
  ne: { name: "Nepali", flag: "🇳🇵" },
  nl: { name: "Dutch", flag: "🇳🇱" },
  no: { name: "Norwegian", flag: "🇳🇴" },
  pl: { name: "Polish", flag: "🇵🇱" },
  "pt-br": { name: "Brazilian Portuguese", flag: "🇧🇷" },
  "pt-pt": { name: "Portuguese", flag: "🇵🇹" },
  ro: { name: "Romanian", flag: "🇷🇴" },
  ru: { name: "Russian", flag: "🇷🇺" },
  sr: { name: "Serbian", flag: "🇷🇸" },
  sv: { name: "Swedish", flag: "🇸🇪" },
  th: { name: "Thai", flag: "🇹🇭" },
  tl: { name: "Filipino", flag: "🇵🇭" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  uk: { name: "Ukrainian", flag: "🇺🇦" },
  vi: { name: "Vietnamese", flag: "🇻🇳" },
};

function languageFor(languageCode?: string): MangaLanguage {
  const code = languageCode?.toLowerCase();
  if (!code) return { name: "Language unavailable", flag: "🌐" };
  return LANGUAGES[code] ?? { name: code.toUpperCase(), flag: "🌐" };
}

export function mangaLanguageName(languageCode?: string) {
  return languageFor(languageCode).name;
}

export function mangaLanguageFlag(languageCode?: string) {
  return languageFor(languageCode).flag;
}

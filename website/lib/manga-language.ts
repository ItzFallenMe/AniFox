const LANGUAGE_NAMES: Record<string, string> = {
  fa: "Persian",
  "pt-br": "Brazilian Portuguese",
  tr: "Turkish",
  vi: "Vietnamese",
};

export function mangaLanguageName(languageCode?: string) {
  if (!languageCode) return "Language unavailable";
  return LANGUAGE_NAMES[languageCode.toLowerCase()] ?? languageCode.toUpperCase();
}

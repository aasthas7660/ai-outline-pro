import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
export type AppLanguage = "en" | "hi" | "mr";

export const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "mr", label: "मराठी (Marathi)" },
];

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

const THEME_KEY = "oc.theme";
const LANG_KEY = "oc.language";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", t === "light");
  root.classList.toggle("dark", t === "dark");
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    try {
      const t = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "dark";
      const l = (localStorage.getItem(LANG_KEY) as AppLanguage | null) ?? "en";
      setThemeState(t);
      setLanguageState(l);
      applyTheme(t);
    } catch {
      applyTheme("dark");
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
    applyTheme(t);
  };
  const setLanguage = (l: AppLanguage) => {
    setLanguageState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
  };

  return (
    <PreferencesContext.Provider value={{ theme, setTheme, language, setLanguage }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}

/* ---------- tiny i18n dictionary ---------- */

type Dict = Record<string, { en: string; hi: string; mr: string }>;

const DICT: Dict = {
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  "nav.new": { en: "New Outline", hi: "नया आउटलाइन", mr: "नवीन आउटलाइन" },
  "nav.seo": { en: "SEO Tools", hi: "SEO टूल्स", mr: "SEO साधने" },
  "nav.content": { en: "Content Tools", hi: "कंटेंट टूल्स", mr: "सामग्री साधने" },
  "nav.competitor": { en: "Competitor Analysis", hi: "प्रतिस्पर्धी विश्लेषण", mr: "स्पर्धक विश्लेषण" },
  "nav.schema": { en: "Schema Generator", hi: "स्कीमा जनरेटर", mr: "स्कीमा जनरेटर" },
  "nav.calendar": { en: "Content Calendar", hi: "कंटेंट कैलेंडर", mr: "सामग्री कॅलेंडर" },
  "nav.links": { en: "Internal Links", hi: "आंतरिक लिंक", mr: "अंतर्गत दुवे" },
  "nav.export": { en: "Export Center", hi: "एक्सपोर्ट सेंटर", mr: "निर्यात केंद्र" },
  "nav.images": { en: "Image Suggestions", hi: "चित्र सुझाव", mr: "प्रतिमा सूचना" },
  "nav.gap": { en: "Content Gap", hi: "कंटेंट गैप", mr: "कंटेंट गॅप" },
  "nav.brief": { en: "Content Brief", hi: "कंटेंट ब्रीफ", mr: "कंटेंट ब्रीफ" },
  "nav.history": { en: "History", hi: "इतिहास", mr: "इतिहास" },
  "nav.favorites": { en: "Favorites", hi: "पसंदीदा", mr: "आवडते" },
  "nav.settings": { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  "nav.workspace": { en: "Workspace", hi: "वर्कस्पेस", mr: "वर्कस्पेस" },
  "nav.signout": { en: "Sign out", hi: "साइन आउट", mr: "साइन आउट" },
};

export function useT() {
  const { language } = usePreferences();
  return (key: keyof typeof DICT) => DICT[key]?.[language] ?? DICT[key]?.en ?? String(key);
}

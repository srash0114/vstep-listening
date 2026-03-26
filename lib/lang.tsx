"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTranslation, type TranslationKey } from "./i18n";

export type Lang = "vi" | "en";

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (vi: string, en: string) => string;
  tx: (key: TranslationKey) => string; // Type-safe translation from i18n file
}

const LangContext = createContext<LangCtx>({
  lang: "vi",
  toggle: () => {},
  t: (vi) => vi,
  tx: (key) => key,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "vi" || stored === "en") setLang(stored);
  }, []);

  const toggle = () => {
    setLang((prev) => {
      const next = prev === "vi" ? "en" : "vi";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);

  const tx = (key: TranslationKey) => getTranslation(key, lang);

  return (
    <LangContext.Provider value={{ lang, toggle, t, tx }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

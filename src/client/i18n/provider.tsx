import { createContext, useContext, useMemo } from "react";
import type { Lang } from "@/shared/types";
import { dictionaries } from "./dictionaries";

const DictContext = createContext<{ lang: Lang }>({ lang: "en" });

export function DictionaryProvider({
  value,
  children,
}: {
  value: { lang: Lang };
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value.lang]);
  return <DictContext.Provider value={memo}>{children}</DictContext.Provider>;
}

export function useDictionary() {
  const { lang } = useContext(DictContext);
  const dict = dictionaries[lang] ?? dictionaries.en;
  return { lang, t: dict };
}

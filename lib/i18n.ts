export type Locale = "ar" | "en";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const storeCopy = {
  ar: {
    brand: "VELORA",
    tagline: "جمالك، أسلوبك، اختيارك",
  },
  en: {
    brand: "VELORA",
    tagline: "Your Beauty, Your Style, Your VELORA.",
  },
} satisfies Record<Locale, { brand: string; tagline: string }>;

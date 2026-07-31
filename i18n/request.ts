import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/utils/constants";

export const locales = SUPPORTED_LOCALES;
export const defaultLocale = DEFAULT_LOCALE;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = SUPPORTED_LOCALES.includes(requested as (typeof SUPPORTED_LOCALES)[number])
    ? (requested as (typeof SUPPORTED_LOCALES)[number])
    : defaultLocale;

  const messages = {
    admin: (await import(`../messages/${locale}/admin.json`)).default,
    auth: (await import(`../messages/${locale}/auth.json`)).default,
  };

  return { locale, messages };
});

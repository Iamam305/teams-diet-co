import QRCode from "qrcode";
import { collectRecipeUrls, type DietDays } from "@/lib/diet-chart";

export async function toQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    width: 160,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

export async function recipeQrMap(days: DietDays) {
  const unique = Array.from(new Set(collectRecipeUrls(days)));
  const entries = await Promise.all(
    unique.map(async (url) => [url, await toQrDataUrl(url)] as const),
  );
  return Object.fromEntries(entries);
}

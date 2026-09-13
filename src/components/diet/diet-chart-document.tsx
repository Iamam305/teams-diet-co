import {
  type DietDays,
  isHttpUrl,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "@/lib/diet-chart";
import { formatDateRange } from "@/lib/format";
import type { OrgBranding } from "@/lib/org-branding";
import { cn } from "@/lib/utils";
import type { ExtraClientInfoItem } from "@/lib/validations";

export function DietChartDocument({
  title,
  clientName,
  createdByName,
  notes,
  startDate,
  endDate,
  extraClientInfo,
  footnote,
  days,
  qrCodes,
  branding,
  className,
}: {
  title: string;
  clientName?: string | null;
  createdByName?: string;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  extraClientInfo?: ExtraClientInfoItem[];
  footnote?: string | null;
  days: DietDays;
  qrCodes: Record<string, string>;
  branding: OrgBranding;
  className?: string;
}) {
  const footnoteText = footnote?.trim() ?? "";

  return (
    <article
      className={cn(
        "diet-chart-print relative overflow-hidden bg-white text-[#1f3328]",
        className,
      )}
    >
      {branding.pdfBackground ? (
        <div aria-hidden className="diet-chart-watermark">
          {/* biome-ignore lint/performance/noImgElement: org watermark is a data URL */}
          <img src={branding.pdfBackground} alt="" />
        </div>
      ) : null}

      <div className="relative">
        <header className="border-b border-[#d7e6dc] pb-4">
          <div className="flex items-center gap-2.5">
            {branding.logo ? (
              // biome-ignore lint/performance/noImgElement: org logo is a data URL
              <img
                src={branding.logo}
                alt=""
                className="size-8 object-contain"
              />
            ) : null}
            <p className="text-xs font-semibold tracking-[0.18em] text-[#2f6a4e] uppercase">
              {branding.name}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#163226]">
            {title.trim() || "Weekly diet chart"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#4d6558]">
            {clientName?.trim() ? <p>Client: {clientName.trim()}</p> : null}
            {formatDateRange(startDate, endDate) ? (
              <p>{formatDateRange(startDate, endDate)}</p>
            ) : null}
            {createdByName ? <p>Prepared by {createdByName}</p> : null}
            {extraClientInfo?.map((item) => (
              <p key={`${item.key}:${item.value}`}>
                {item.key}: {item.value.trim() || "-"}
              </p>
            ))}
          </div>
          {notes?.trim() ? (
            <p className="mt-3 text-sm text-[#4d6558]">{notes.trim()}</p>
          ) : null}
        </header>

        <div className="mt-6 space-y-6">
          {WEEKDAYS.map((weekday) => (
            <section key={weekday} className="break-inside-avoid">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-[#2f6a4e] uppercase">
                {WEEKDAY_LABELS[weekday]}
              </h2>
              <table className="w-full border-collapse overflow-hidden rounded-lg border border-[#cfe0d5] text-sm">
                <thead>
                  <tr className="bg-[#2f6a4e] text-left text-[11px] font-semibold tracking-wide text-[#f4faf6] uppercase">
                    <th className="w-[24%] px-3 py-2">Meal name</th>
                    <th className="w-[56%] px-3 py-2">Meal contents</th>
                    <th className="w-[20%] px-3 py-2 text-center">Recipe</th>
                  </tr>
                </thead>
                <tbody>
                  {days[weekday].meals.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-[#4d6558]">
                        No meals yet.
                      </td>
                    </tr>
                  ) : (
                    days[weekday].meals.map((meal, index) => {
                      const recipeUrl = meal.recipeUrl.trim();
                      const qr = isHttpUrl(recipeUrl)
                        ? qrCodes[recipeUrl]
                        : undefined;

                      return (
                        <tr
                          key={meal.id}
                          className={cn(
                            "border-t border-[#d7e6dc] align-top",
                            index % 2 === 1 && "bg-[#f4f8f5]",
                          )}
                        >
                          <td className="px-3 py-3 font-semibold text-[#163226]">
                            {meal.name}
                          </td>
                          <td className="px-3 py-3 whitespace-pre-wrap leading-relaxed text-[#33463c]">
                            {meal.content.trim() || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {qr ? (
                              <div className="flex flex-col items-center gap-1">
                                {/* biome-ignore lint/performance/noImgElement: QR codes are inline data URLs */}
                                <img
                                  src={qr}
                                  alt={`Recipe link for ${meal.name}`}
                                  className="size-14"
                                />
                                <a
                                  href={recipeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium text-[#2f6a4e] underline underline-offset-2"
                                >
                                  Recipe
                                </a>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        {footnoteText ? (
          <footer className="mt-8 border-t border-[#d7e6dc] pt-3 text-xs leading-relaxed text-[#4d6558]">
            {footnoteText}
          </footer>
        ) : null}
      </div>
    </article>
  );
}

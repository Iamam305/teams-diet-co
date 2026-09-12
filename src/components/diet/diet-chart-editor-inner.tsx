"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DietChartDocument } from "@/components/diet/diet-chart-document";
import { DietDayEditor } from "@/components/diet/diet-day-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  cloneDay,
  type DietDay,
  type DietDays,
  dietDaySchema,
  normalizeDays,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
  WEEKDAYS,
  type Weekday,
} from "@/lib/diet-chart";
import type { OrgBranding } from "@/lib/org-branding";
import { recipeQrMap } from "@/lib/qr";
import {
  type DietChartFormValues,
  dietChartFormSchema,
} from "@/lib/validations";
import {
  createDietChartAction,
  updateDietChartAction,
} from "@/server/diet-charts";

const CLIPBOARD_KEY = "team-diet-co-day-clipboard";

export type DietChartEditorChart = {
  id?: string;
  title: string;
  clientName: string | null;
  notes: string | null;
  startDate: string | null;
  endDate: string | null;
  days: DietDays;
  createdByName: string;
  updatedByName: string;
  updatedAtLabel: string;
};

function readClipboard(): DietDay | null {
  try {
    const raw = window.sessionStorage.getItem(CLIPBOARD_KEY);
    if (!raw) {
      return null;
    }
    return dietDaySchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function toSavePayload(values: DietChartFormValues) {
  return {
    title: values.title.trim() || "Untitled diet chart",
    clientName: values.clientName,
    notes: values.notes,
    startDate: values.startDate,
    endDate: values.endDate,
    days: normalizeDays(values.days),
  };
}

export function DietChartEditorInner({
  chart,
  branding,
  mode = "edit",
}: {
  chart: DietChartEditorChart;
  branding: OrgBranding;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const form = useForm<DietChartFormValues>({
    resolver: zodResolver(dietChartFormSchema),
    shouldUnregister: false,
    defaultValues: {
      title: chart.title,
      clientName: chart.clientName ?? "",
      notes: chart.notes ?? "",
      startDate: chart.startDate ?? "",
      endDate: chart.endDate ?? "",
      days: chart.days,
    },
  });
  const [activeWeekday, setActiveWeekday] = useState<Weekday>("monday");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [clipboard, setClipboard] = useState<DietDay | null>(null);
  const [pdfPending, setPdfPending] = useState(false);
  const skipFirstSave = useRef(true);
  const saveTimer = useRef<number | null>(null);
  const title = form.watch("title");
  const clientName = form.watch("clientName");
  const notes = form.watch("notes");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const days = form.watch("days");

  useEffect(() => {
    setClipboard(readClipboard());
  }, []);

  useEffect(() => {
    let cancelled = false;
    recipeQrMap(days)
      .then((map) => {
        if (!cancelled) {
          setQrCodes(map);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodes({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  useEffect(() => {
    if (mode !== "edit" || !chart.id) {
      return;
    }

    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }

    setSaveState("saving");
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    const chartId = chart.id;
    const payload = toSavePayload({
      title,
      clientName,
      notes,
      startDate,
      endDate,
      days,
    });

    saveTimer.current = window.setTimeout(async () => {
      const result = await updateDietChartAction({
        id: chartId,
        ...payload,
      });
      if (!result.ok) {
        setSaveState("error");
        toast.error(result.error);
        return;
      }
      setSaveState("saved");
    }, 700);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [chart.id, clientName, days, endDate, mode, notes, startDate, title]);

  function copyDay(weekday: Weekday) {
    const cloned = cloneDay(form.getValues(`days.${weekday}`));
    window.sessionStorage.setItem(CLIPBOARD_KEY, JSON.stringify(cloned));
    setClipboard(cloned);
    toast.success(`${WEEKDAY_LABELS[weekday]} copied.`);
  }

  function pasteDay(weekday: Weekday) {
    const source = clipboard ?? readClipboard();
    if (!source) {
      toast.error("Nothing to paste yet.");
      return null;
    }
    const cloned = cloneDay(source);
    toast.success(`Pasted onto ${WEEKDAY_LABELS[weekday]}.`);
    return cloned;
  }

  async function onCreate(values: DietChartFormValues) {
    const result = await createDietChartAction(toSavePayload(values));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Diet chart created.");
    router.push(`/diet-charts/${result.id}`);
    router.refresh();
  }

  async function downloadPdf() {
    setPdfPending(true);
    try {
      const codes = Object.keys(qrCodes).length
        ? qrCodes
        : await recipeQrMap(days);
      const { pdf } = await import("@react-pdf/renderer");
      const { DietChartPdfDocument } = await import(
        "@/components/diet/diet-chart-pdf"
      );
      const blob = await pdf(
        <DietChartPdfDocument
          title={title}
          clientName={clientName}
          createdByName={chart.createdByName}
          days={days}
          qrCodes={codes}
          notes={notes}
          startDate={startDate}
          endDate={endDate}
          branding={branding}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = (title.trim() || "diet-chart")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
      link.href = url;
      link.download = `${slug || "diet-chart"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download PDF.");
    } finally {
      setPdfPending(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={
          mode === "create"
            ? form.handleSubmit(onCreate)
            : (event) => event.preventDefault()
        }
      >
        <div className="-mx-4 mb-6 border-b px-4 py-2 print:hidden md:-mx-8 md:px-8 md:py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(form.formState.errors.title)}>
                <FieldLabel htmlFor="chart-title">Chart title</FieldLabel>
                <Input
                  id="chart-title"
                  className="mt-1"
                  {...form.register("title")}
                />
                <FieldError>{form.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="client-name">Client name</FieldLabel>
                <Input
                  id="client-name"
                  placeholder="Optional"
                  className="mt-1"
                  {...form.register("clientName")}
                />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.startDate)}>
                <FieldLabel htmlFor="chart-start-date">
                  Start date (optional)
                </FieldLabel>
                <Input
                  id="chart-start-date"
                  type="date"
                  className="mt-1"
                  {...form.register("startDate")}
                />
                <FieldError>
                  {form.formState.errors.startDate?.message}
                </FieldError>
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.endDate)}>
                <FieldLabel htmlFor="chart-end-date">
                  End date (optional)
                </FieldLabel>
                <Input
                  id="chart-end-date"
                  type="date"
                  className="mt-1"
                  {...form.register("endDate")}
                />
                <FieldError>
                  {form.formState.errors.endDate?.message}
                </FieldError>
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {mode === "edit" ? (
                <p className="text-xs text-muted-foreground">
                  {saveState === "saving"
                    ? "Saving..."
                    : saveState === "error"
                      ? "Save failed"
                      : "Saved"}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </Button>
              <Button type="button" onClick={downloadPdf} disabled={pdfPending}>
                {pdfPending ? "Preparing..." : "Download PDF"}
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel htmlFor="chart-notes">Notes</FieldLabel>
            <Input
              id="chart-notes"
              placeholder="Optional notes for this chart"
              className="mt-1"
              {...form.register("notes")}
            />
          </div>
          {mode === "edit" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Created by {chart.createdByName} · Last edited by{" "}
              {chart.updatedByName} {chart.updatedAtLabel}
            </p>
          ) : null}
          <div
            role="tablist"
            aria-label="Weekdays"
            className="mt-4 flex flex-wrap gap-1"
          >
            {WEEKDAYS.map((weekday) => {
              const selected = activeWeekday === weekday;
              return (
                <Button
                  key={weekday}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`day-panel-${weekday}`}
                  id={`day-tab-${weekday}`}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveWeekday(weekday)}
                >
                  <span className="sm:hidden">
                    {WEEKDAY_SHORT_LABELS[weekday]}
                  </span>
                  <span className="hidden sm:inline">
                    {WEEKDAY_LABELS[weekday]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="print:hidden">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              role="tabpanel"
              id={`day-panel-${weekday}`}
              aria-labelledby={`day-tab-${weekday}`}
              hidden={activeWeekday !== weekday}
            >
              <DietDayEditor
                weekday={weekday}
                canPaste={Boolean(clipboard)}
                onCopy={() => copyDay(weekday)}
                onPaste={() => pasteDay(weekday)}
              />
            </div>
          ))}
        </div>

        {mode === "create" ? (
          <div className="mt-6 print:hidden">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create chart"}
            </Button>
          </div>
        ) : null}

        <div className="hidden print:block">
          <DietChartDocument
            title={title}
            clientName={clientName}
            createdByName={chart.createdByName}
            notes={notes}
            startDate={startDate}
            endDate={endDate}
            days={days}
            qrCodes={qrCodes}
            branding={branding}
          />
        </div>
      </form>

      {previewOpen ? (
        <Dialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title="Diet chart preview"
          description="This is how the weekly chart will look when printed or downloaded."
          className="h-[90dvh] max-h-[90dvh] w-[calc(100%-1rem)] max-w-4xl overflow-y-auto sm:h-auto sm:max-h-[90vh]"
        >
          <DietChartDocument
            title={title}
            clientName={clientName}
            createdByName={chart.createdByName}
            notes={notes}
            startDate={startDate}
            endDate={endDate}
            days={days}
            qrCodes={qrCodes}
            branding={branding}
          />
        </Dialog>
      ) : null}
    </FormProvider>
  );
}

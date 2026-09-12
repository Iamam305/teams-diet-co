"use client";

import { useRouter } from "next/navigation";
import { type RefObject, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { compressImageFile } from "@/lib/compress-image";
import { brandingMetadata, parseOrgBranding } from "@/lib/org-branding";
import { slugFromName } from "@/lib/validations";

export function OrganizationSettingsForm({
  organization,
}: {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: unknown;
  };
}) {
  const router = useRouter();
  const branding = parseOrgBranding(organization);
  const [pending, setPending] = useState(false);
  const [logo, setLogo] = useState<string | null>(branding.logo);
  const [pdfBackground, setPdfBackground] = useState<string | null>(
    branding.pdfBackground,
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const form = useForm({
    defaultValues: { name: organization.name, slug: organization.slug },
  });

  async function onPickImage(
    file: File | undefined,
    kind: "logo" | "background",
  ) {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await compressImageFile(
        file,
        kind === "logo"
          ? { maxWidth: 256, maxHeight: 256, mime: "image/png" }
          : {
              maxWidth: 1600,
              maxHeight: 1600,
              mime: "image/jpeg",
              quality: 0.72,
            },
      );
      if (kind === "logo") {
        setLogo(dataUrl);
      } else {
        setPdfBackground(dataUrl);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not read that image.",
      );
    }
  }

  async function onSubmit(values: { name: string; slug: string }) {
    setPending(true);
    const { error } = await authClient.organization.update({
      data: {
        name: values.name,
        slug: values.slug || slugFromName(values.name),
        logo,
        metadata: brandingMetadata(pdfBackground, organization.metadata),
      },
      organizationId: organization.id,
    });
    setPending(false);

    if (error) {
      toast.error(getAuthErrorMessage(error, "Could not update organization."));
      return;
    }

    toast.success("Organization updated.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="org-name">Name</FieldLabel>
          <Input id="org-name" {...form.register("name", { required: true })} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
          <Input id="org-slug" {...form.register("slug", { required: true })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="org-logo">Logo</FieldLabel>
          <FieldDescription>
            Shown in the app sidebar and at the top of diet chart PDFs.
          </FieldDescription>
          <ImagePicker
            id="org-logo"
            inputRef={logoInputRef}
            preview={logo}
            previewClassName="size-16 object-contain"
            emptyLabel="Square PNG or JPEG, up to 4 MB"
            onPick={(file) => onPickImage(file, "logo")}
            onRemove={() => {
              setLogo(null);
              if (logoInputRef.current) {
                logoInputRef.current.value = "";
              }
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="org-background">PDF background</FieldLabel>
          <FieldDescription>
            Centered on every page of downloaded and printed diet charts.
          </FieldDescription>
          <ImagePicker
            id="org-background"
            inputRef={backgroundInputRef}
            preview={pdfBackground}
            previewClassName="h-28 w-full object-contain"
            emptyLabel="Centered watermark, up to 4 MB"
            onPick={(file) => onPickImage(file, "background")}
            onRemove={() => {
              setPdfBackground(null);
              if (backgroundInputRef.current) {
                backgroundInputRef.current.value = "";
              }
            }}
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function ImagePicker({
  id,
  inputRef,
  preview,
  previewClassName,
  emptyLabel,
  onPick,
  onRemove,
}: {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  preview: string | null;
  previewClassName: string;
  emptyLabel: string;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-3">
      {preview ? (
        <div className="mb-3 overflow-hidden rounded-lg bg-muted/60 p-2">
          {/* biome-ignore lint/performance/noImgElement: preview of a local data URL */}
          <img src={preview} alt="" className={previewClassName} />
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
        {preview ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

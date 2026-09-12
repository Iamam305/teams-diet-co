export type OrgBranding = {
  name: string;
  logo: string | null;
  pdfBackground: string | null;
};

export function parseOrgMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function isDataImageUrl(value: string) {
  return /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
}

function asImageDataUrl(value: unknown): string | null {
  return typeof value === "string" && isDataImageUrl(value) ? value : null;
}

function asLogoUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (isDataImageUrl(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export function parseOrgBranding(org: {
  name?: string | null;
  logo?: string | null;
  metadata?: unknown;
}): OrgBranding {
  const metadata = parseOrgMetadata(org.metadata);
  const name = org.name?.trim();

  return {
    name: name || "Team Diet Co",
    logo: asLogoUrl(org.logo),
    pdfBackground: asImageDataUrl(metadata.pdfBackground),
  };
}

export function brandingMetadata(
  pdfBackground: string | null,
  existing?: unknown,
) {
  const metadata = parseOrgMetadata(existing);

  if (pdfBackground) {
    metadata.pdfBackground = pdfBackground;
  } else {
    delete metadata.pdfBackground;
  }

  return metadata;
}

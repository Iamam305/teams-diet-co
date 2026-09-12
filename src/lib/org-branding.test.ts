import { describe, expect, it } from "vitest";
import {
  brandingMetadata,
  parseOrgBranding,
  parseOrgMetadata,
} from "@/lib/org-branding";

const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("org branding", () => {
  it("parses string and object metadata", () => {
    expect(parseOrgMetadata('{"pdfBackground":"x"}')).toEqual({
      pdfBackground: "x",
    });
    expect(parseOrgMetadata({ pdfBackground: png })).toEqual({
      pdfBackground: png,
    });
    expect(parseOrgMetadata("not-json")).toEqual({});
  });

  it("reads name, logo, and pdf background", () => {
    expect(
      parseOrgBranding({
        name: "  Green Kitchen  ",
        logo: png,
        metadata: { pdfBackground: png },
      }),
    ).toEqual({
      name: "Green Kitchen",
      logo: png,
      pdfBackground: png,
    });
  });

  it("falls back to the product name and ignores invalid images", () => {
    expect(
      parseOrgBranding({
        name: " ",
        logo: "not-an-image",
        metadata: { pdfBackground: "https://example.com/bg.png" },
      }),
    ).toEqual({
      name: "Team Diet Co",
      logo: null,
      pdfBackground: null,
    });
  });

  it("merges pdf background into existing metadata", () => {
    expect(brandingMetadata(png, { keep: true })).toEqual({
      keep: true,
      pdfBackground: png,
    });
    expect(brandingMetadata(null, { keep: true, pdfBackground: png })).toEqual({
      keep: true,
    });
  });
});

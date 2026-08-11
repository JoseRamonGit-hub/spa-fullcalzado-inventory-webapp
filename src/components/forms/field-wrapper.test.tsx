/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "@/components/ui/label";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "./field-wrapper";

const design = readFileSync(resolve(process.cwd(), "DESIGN.md"), "utf8");

describe("compact field label typography", () => {
  it("overrides the base label size with the incumbent typography documented by the design system", () => {
    render(<Label className={COMPACT_FIELD_LABEL_CLASS_NAME}>Etiqueta compacta</Label>);

    const label = screen.getByText("Etiqueta compacta");
    expect(label).toHaveClass("text-[11px]", "font-medium", "tracking-wider", "uppercase");
    expect(label).not.toHaveClass("text-sm", "font-heading", "font-semibold", "tracking-widest");
    expect(design).toMatch(
      /label:\n\s+fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"\n\s+fontSize: "0\.6875rem"\n\s+fontWeight: 500\n\s+lineHeight: 1\n\s+letterSpacing: "0\.05em"/,
    );
  });
});

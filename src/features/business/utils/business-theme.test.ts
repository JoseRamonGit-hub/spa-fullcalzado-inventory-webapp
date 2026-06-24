import { describe, expect, it } from "vitest";
import { getBusinessAccentStyle, getBusinessTheme, getBusinessIconStyle } from "./business-theme";

describe("getBusinessTheme", () => {
  it("retorna un tema distinto para Zapatería Estilos", () => {
    const fullCalzadoTheme = getBusinessTheme({ slug: "full-calzado" });
    const estilosTheme = getBusinessTheme({ slug: "zapateria-estilos" });

    expect(estilosTheme.gradient).not.toBe(fullCalzadoTheme.gradient);
    expect(estilosTheme.accent).not.toBe(fullCalzadoTheme.accent);
  });

  it("usa Full Calzado como fallback visual", () => {
    const fallbackTheme = getBusinessTheme(null);
    const fullCalzadoTheme = getBusinessTheme({ slug: "full-calzado" });

    expect(fallbackTheme).toBe(fullCalzadoTheme);
    expect(getBusinessTheme({ slug: "negocio-desconocido" })).toBe(fullCalzadoTheme);
  });

  it("expone estilos reutilizables para iconos y acentos", () => {
    const theme = getBusinessTheme({ slug: "zapateria-estilos" });

    expect(getBusinessIconStyle(theme)).toMatchObject({
      background: theme.gradient,
      color: theme.foreground,
    });
    expect(getBusinessAccentStyle(theme)).toMatchObject({
      backgroundColor: theme.accentSurface,
      borderColor: theme.accentBorder,
      color: theme.accent,
    });
  });
});

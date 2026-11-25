/** Normaliza un texto para buscar sin distinguir mayúsculas, tildes ni espacios a los lados. */
export function normalizeSearchValue(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-VE");
}

const LEGAL_SUFFIXES = new Set(["ca", "sa", "srl"]);

export function getBusinessInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !LEGAL_SUFFIXES.has(word.replaceAll(".", "").toLowerCase()));

  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

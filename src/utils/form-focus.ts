export const handleFormFocusError = () => {
  requestAnimationFrame(() => {
    const firstErrorInput = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;

    if (firstErrorInput) {
      firstErrorInput.focus();
      firstErrorInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
};

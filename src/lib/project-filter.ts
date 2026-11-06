// Built from the options so a new service needs no CSS. Browsers without :has() ignore these rules and keep every project visible.
export function projectFilterCss(serviceIds: string[]): string {
  return serviceIds
    .map(
      (id) =>
        `[data-project-filter]:has(input[value="${id}"]:checked) ~ [data-project-grid] > :not([data-project-service="${id}"]) { display: none; }`,
    )
    .join('\n');
}

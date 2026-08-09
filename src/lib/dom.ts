export function getSearchValue(input: string): string {
  const search = window.location.search;
  if (!search) return '';
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(input) ?? '';
}

export function clearSearch(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  if (!searchInput) return;
  searchInput.blur();
  searchInput.value = '';
  searchInput.defaultValue = '';
}

export function handleDefaultSearchBtn(): void {
  const seachBtn: HTMLElement | null = document.getElementById('search-btn');
  if (seachBtn != null) seachBtn.focus();
}

export function handleDefaultSearchInp(): void {
  const searchInput: HTMLInputElement | null = document.getElementById(
    'search-input',
  ) as HTMLInputElement;
  if (searchInput != null) {
    const value: string = getSearchValue('q');
    searchInput.value = value;
    searchInput.defaultValue = value;
    searchInput.setSelectionRange(value.length, value.length);
    searchInput.focus();
  }
}

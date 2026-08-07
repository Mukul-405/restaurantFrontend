export interface SearchableMenuItem {
  name: string;
  description?: string;
  categoryName?: string;
}

// Every word must appear somewhere in name/description/category. Trimmed and
// order-insensitive so "paneer tikka" finds "Tikka Paneer" and a stray trailing
// space from a phone keyboard doesn't empty the list.
export const matchesMenuSearch = (item: SearchableMenuItem, query: string): boolean => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = `${item.name} ${item.description ?? ''} ${item.categoryName ?? ''}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

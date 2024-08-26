export interface dataTable<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

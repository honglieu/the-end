import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterTable'
})
export class FilterTablePipe implements PipeTransform {
  transform<TList>(
    data: TList[],
    searchText: string,
    searchField?: string
  ): TList[] {
    if (!data) {
      return [];
    }
    if (!searchText || searchText === '') {
      return data;
    }
    const searchTerm = searchText.toLowerCase();
    return data.filter((it) => {
      if (searchField) {
        return it[searchField].toString().toLowerCase().includes(searchTerm);
      }
      const mergeTxt = Object.keys(it)
        .map((key) => it[key])
        .join('');
      return mergeTxt.toLowerCase().includes(searchTerm);
    });
  }
}

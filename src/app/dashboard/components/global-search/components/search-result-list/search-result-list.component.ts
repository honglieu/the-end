import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { IGlobalSearchConversation } from '@/app/dashboard/components/global-search/interfaces/global-search.interface';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { SearchResultRowComponent } from '@/app/dashboard/components/global-search/components/search-result-row/search-result-row.component';

@Component({
  selector: 'search-result-list',
  templateUrl: './search-result-list.component.html',
  styleUrls: ['./search-result-list.component.scss']
})
export class SearchResultListComponent implements OnInit {
  @ViewChildren(SearchResultRowComponent)
  resultRowRef: QueryList<SearchResultRowComponent>;
  @Input() searchResultList: IGlobalSearchConversation[] = [];
  @Input() isLoading = false;
  @Input() isAllConversationFetched = false;
  @Input() isLoadingMore = false;
  @Input() pageIndex = 1;
  @Output() handleLoadingMore = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {}

  onScrollDown(event: Event) {
    event.preventDefault();
    const element = event.target as HTMLElement;
    if (this.isAllConversationFetched || this.isLoadingMore || this.isLoading) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom <= SCROLL_THRESHOLD) {
      this.handleLoadingMore.emit();
    }
  }
  handleKeydown(event: KeyboardEvent) {
    event.preventDefault();
    const currentElement = event.target as HTMLElement;
    const key = event.key;
    let rowIndex = 0;

    if (key === 'Tab') {
      (
        document.querySelector(
          '.filter-mailbox .trudi-select-dropdown-button'
        ) as HTMLElement
      ).focus();
    }
    if (key === 'Enter') {
      currentElement.parentElement.childNodes.forEach((value, index) => {
        if (value === document.activeElement) {
          rowIndex = index;
        }
      });
      this.resultRowRef.get(rowIndex).handleNavigateToEmailResult();
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const nextElement = (
        key === 'ArrowUp'
          ? currentElement.previousElementSibling
          : currentElement.nextElementSibling
      ) as HTMLElement;
      if (nextElement) {
        nextElement.focus();
      }
    }
  }
}

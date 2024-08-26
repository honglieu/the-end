import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: 'pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() itemPerRowOptions = [
    {
      id: 1,
      text: 10
    },
    {
      id: 2,
      text: 20
    },
    {
      id: 3,
      text: 50
    },
    {
      id: 4,
      text: 100
    }
  ];
  @Input() selectedRowOption = 4;
  @Input() totalPages = 4;
  @Input() pageIndex = 4;
  @Input() pageSize = 4;
  @Input() totalItems = 4;

  @Output() onGoToFirstPage = new EventEmitter<number>();
  @Output() onGoToPrevPage = new EventEmitter<number>();
  @Output() onGoToNextPage = new EventEmitter<number>();
  @Output() onGoToLastPage = new EventEmitter<number>();

  @Output() onRowOfPage = new EventEmitter<number>();

  hanleRowOfPage(event: number) {
    this.onRowOfPage.emit(event);
  }

  handleGoToFirstPage(event: number) {
    this.onGoToFirstPage.emit(event);
  }

  handleGoToPrevPage(event: number) {
    this.onGoToPrevPage.emit(event);
  }

  handleGoToNextPage(event: number) {
    this.onGoToNextPage.emit(event);
  }

  handleGoToLastPage(event: number) {
    this.onGoToLastPage.emit(event);
  }
}

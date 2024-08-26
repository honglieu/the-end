import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

interface IPageSizeOptions {
  id: number;
  label: number;
}

export interface IEmitPagination {
  pageIndex: number;
  pageSize: number;
}

export interface IPaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

enum EPaginationPlacement {
  START,
  CENTER,
  END
}

enum EArrowIconType {
  FIRST_PAGE,
  PREV_PAGE,
  NEXT_PAGE,
  LAST_PAGE
}

enum EPageSizeOption {
  SIZE20,
  SIZE50,
  SIZE100
}

@Component({
  selector: 'trudi-pagination',
  templateUrl: './trudi-pagination.component.html',
  styleUrls: ['./trudi-pagination.component.scss']
})
export class TrudiPaginationComponent implements OnInit {
  @Input() paginationData: IPaginationData = {
    totalItems: 0,
    totalPages: 0,
    currentPage: 0
  };
  @Input() pageSize: number = 100;
  @Input() paginationPlacement = EPaginationPlacement.END;
  @Output() changePagination = new EventEmitter<IEmitPagination>();

  public pageIndex = 0;
  public readonly ARROW_ICON_TYPE = EArrowIconType;
  public readonly pageSizeOptions: IPageSizeOptions[] = [
    {
      id: EPageSizeOption.SIZE20,
      label: 20
    },
    {
      id: EPageSizeOption.SIZE50,
      label: 50
    },
    {
      id: EPageSizeOption.SIZE100,
      label: 100
    }
  ];
  public readonly PAGINATION_PLACEMENT = EPaginationPlacement;
  public currentPageSizeOption = EPageSizeOption.SIZE100;

  constructor() {}

  ngOnInit(): void {}

  public handleChangePageSizeOptions(dataOptions: IPageSizeOptions): void {
    if (dataOptions) {
      this.pageIndex = 0;
      this.pageSize = dataOptions.label;
      this.changePagination.emit({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      });
    }
  }

  public onClickArrow(type: EArrowIconType, pageSize: number) {
    switch (type) {
      case EArrowIconType.FIRST_PAGE:
        this.onGoToFirstPage(pageSize);
        break;
      case EArrowIconType.NEXT_PAGE:
        this.onGoToNextPage(pageSize);
        break;
      case EArrowIconType.PREV_PAGE:
        this.onGoToPrevPage(pageSize);
        break;
      case EArrowIconType.LAST_PAGE:
        this.onGoToLastPage(pageSize);
        break;
      default:
        break;
    }
  }

  public onGoToFirstPage(pageSize: number) {
    if (pageSize) {
      this.pageIndex = 0;
      this.changePagination.emit({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      });
    }
  }

  public onGoToPrevPage(pageSize: number) {
    if (pageSize) {
      this.pageIndex--;
      this.changePagination.emit({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      });
    }
  }

  public onGoToNextPage(pageSize: number) {
    if (pageSize) {
      this.pageIndex++;
      this.changePagination.emit({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      });
    }
  }

  public onGoToLastPage(pageSize: number) {
    if (pageSize) {
      this.pageIndex = this.paginationData.totalPages - 1;
      this.changePagination.emit({
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      });
    }
  }
}

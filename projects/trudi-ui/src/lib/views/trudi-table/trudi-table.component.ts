import {
  Component,
  Input,
  Output,
  OnInit,
  ViewChild,
  AfterViewInit,
  ElementRef,
  EventEmitter,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { IPaginationData, IEmitPagination } from './components';

interface ITableRow {
  [key: string]: string | boolean;
}

interface ITableColumnSchema {
  key: string;
  label: string;
  width?: string;
}

export enum ETrudiTableSize {
  DEFAULT = 'default',
  SMALL = 'small',
  MIDDLE = 'middle'
}

@Component({
  selector: 'trudi-table',
  templateUrl: './trudi-table.component.html',
  styleUrls: ['./trudi-table.component.scss']
})
export class TrudiTableComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('trudiRow', { static: false })
  trudiRow: ElementRef;
  @Input() trudiTableColumns: ITableColumnSchema[] = [];
  @Input() trudiTableDataSource: ITableRow[] = [];
  @Input() trudiPaginationData: IPaginationData = {
    totalItems: 0,
    totalPages: 0,
    currentPage: 0
  };
  @Input() showCheckbox = true;
  @Input() showPagination = true;
  @Input() showTooltip = false;
  @Input() tooltipTitle: string = '';
  @Input() showTooltipCheckbox = false;
  @Input() tableSize: ETrudiTableSize = ETrudiTableSize.DEFAULT;
  @Input() disableCheckbox = false;
  @Output() refreshTable = new EventEmitter<IEmitPagination>();
  @Output() selectedRow = new EventEmitter();
  @Output() onClickItems = new EventEmitter();
  @Input() searchText: string;

  @Input() checkedAll = false;
  public isLoading = false;
  public setOfCheckedId = new Set<string>();
  public scrollY: string | null = null;
  public trudiTablePageSize = 100;
  public isSelectedAll: boolean = false;
  public readonly limitTableRows = 20;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trudiTableDataSource']?.currentValue) {
      this.updateCheckedRow(this.trudiTableDataSource);
      this.handleCheckedStatus();
    }
  }

  ngAfterViewInit() {
    this.calculateTableHeight(15);
  }

  updateCheckedRow(tableData: ITableRow[]) {
    if (tableData.length) {
      this.trudiTableDataSource = tableData.map((it) => ({
        ...it,
        checked: this.setOfCheckedId.has(it?.['id'] as string)
      }));
    }
  }

  onChangePagination(data: IEmitPagination) {
    this.trudiTablePageSize = data.pageSize;
    if (data.pageSize === 100 || data.pageSize === 50) {
      this.calculateTableHeight(15);
    } else {
      this.calculateTableHeight(10);
    }
    this.refreshTable.emit(data);
  }

  calculateTableHeight(multiplier: number) {
    if (this.trudiRow) {
      const rowHeight = this.trudiRow.nativeElement.clientHeight;
      this.scrollY = rowHeight * multiplier + 'px';
    }
  }

  updateCheckedSet(id, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  handleCheckedStatus(): void {
    const isCheckedAll = this.trudiTableDataSource
      .filter((res) => !res?.['disabled'])
      .every((value) => value?.['checked']);

    if (
      !isCheckedAll &&
      this.trudiTableDataSource.some((item) => item?.['checked'])
    ) {
      this.checkedAll = true;
      this.isSelectedAll = true;
    } else {
      this.checkedAll = isCheckedAll;
      this.isSelectedAll = false;
    }
  }

  onAllChecked(value: boolean): void {
    this.trudiTableDataSource = this.trudiTableDataSource
      .filter(({ disabled }) => !disabled)
      .map((it) => {
        this.updateCheckedSet(it?.['id'], value);
        return {
          ...it,
          checked: value
        };
      });
    this.isSelectedAll = false;
    this.selectedRow.emit(this.setOfCheckedId.values());
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.handleCheckedStatus();
    this.selectedRow.emit(this.setOfCheckedId.values());
  }

  handleClickItems(data) {
    this.onClickItems.emit(data);
  }
}

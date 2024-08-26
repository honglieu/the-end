import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { IAiReply } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { SharedService } from '@services/shared.service';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Subject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  ESortOrder,
  EPolicyTableColumnName
} from '@/app/dashboard/modules/agency-settings/enum/account-setting.enum';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';

@Component({
  selector: 'ai-replies-table',
  templateUrl: './ai-replies-table.component.html',
  styleUrls: ['./ai-replies-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiRepliesTableComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('replyQuestions') replyQuestions: ElementRef;
  @ViewChild('policiesTable') myTable: ElementRef;
  @ViewChild('tableContainer') tableContainer: ElementRef;

  @Input() aiReplies: IAiReply[] = [];
  @Input() isLoadingNew: boolean = false;
  @Input() isDeselectAIReply: boolean;
  @Input() isNoPolices: boolean = true;
  @Input() removeClass: boolean = false;
  @Input() isFiltering: boolean = false;
  @Output() clickRow: EventEmitter<IAiReply> = new EventEmitter<IAiReply>();
  @Output() changeSelected: EventEmitter<void> = new EventEmitter<void>();
  @Output() endScroll: EventEmitter<void> = new EventEmitter<void>();
  @Output() sortEvent = new EventEmitter<{
    columnName: string;
    sortOrder: string;
  }>();
  private destroy$: Subject<void> = new Subject<void>();
  public changeAutomated$: Subject<IAiReply> = new Subject<IAiReply>();
  public pipeDateFormat: string;
  public cssResponseWidth: string;
  public searchValue: string = '';
  public rowsSkeletonNewLoading: Array<number>;
  public rowsSkeletonMoreLoading: Array<number> = Array(3);
  public isConsole: boolean = false;
  public isArchivedMailbox: boolean = false;
  public search: string;
  public selectedAIReply: IAiReply;
  public sortOrder = {
    name: ESortOrder.default,
    createdAt: ESortOrder.default,
    updatedAt: ESortOrder.descending
  };
  public columnIcon = {
    name: 'sortDefault',
    createdAt: 'sortDefault',
    updatedAt: 'sortDescendPolicy'
  };

  public listOfColumn = [
    {
      title: 'Policies',
      width: '220px',
      icon: this.columnIcon.name,
      click: this.handleSortByName.bind(this),
      tooltip: 'Sort A-Z',
      key: EPolicyTableColumnName.name
    },
    {
      title: 'Questions',
      width: '',
      icon: '',
      click: '',
      tooltip: '',
      key: EPolicyTableColumnName.questions
    },
    {
      title: 'Created date',
      width: '150px',
      icon: this.columnIcon.createdAt,
      click: this.handleSortByCreatedDate.bind(this),
      tooltip: 'Sort by created date',
      key: EPolicyTableColumnName.createdAt
    },
    {
      title: 'Last updated',
      width: '150px',
      icon: this.columnIcon.updatedAt,
      click: this.handleSortByLastUpdated.bind(this),
      tooltip: 'Sorted by last updated',
      key: EPolicyTableColumnName.updatedAt
    }
  ];
  private policyFilterChange$ = combineLatest([
    this.aiPolicyService.aiReplyPolicySearchValue$,
    this.aiPolicyService.sortEvent$
  ]);

  constructor(
    private _agencyDateFormatService: AgencyDateFormatService,
    private _changeDetectorRef: ChangeDetectorRef,
    public sharedService: SharedService,
    private aiPolicyService: AiPolicyService,
    public inboxService: InboxService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['removeClass']?.currentValue) {
      this.selectedAIReply = null;
    }

    if (changes['isLoadingNew']?.currentValue) {
      this.isLoadingNew = changes['isLoadingNew']?.currentValue;
    }
  }
  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.policyFilterChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(([search, sortEvent]) => {
        this.searchValue = search?.trim();
        this.handleSortEvent(sortEvent.columnName, sortEvent.sortOrder);
        this.updateListOfColumns();
      });

    this._agencyDateFormatService.dateFormat$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (res && !this.pipeDateFormat) {
          this.pipeDateFormat = res.DATE_FORMAT_PIPE;
          this._changeDetectorRef.markForCheck();
        }
      });
  }

  ngAfterViewInit() {
    this.setColumnWidthQuestion();
  }
  setColumnWidthQuestion() {
    const tableContainerWidth = this.tableContainer?.nativeElement?.offsetWidth;
    this.listOfColumn = this.listOfColumn.map((column) => {
      if (column.key === EPolicyTableColumnName.questions) {
        return {
          ...column,
          width: `${tableContainerWidth - 522}px`
        };
      }
      return column;
    });
  }

  public onClickRow(event: Event, aiReply: IAiReply) {
    event.stopPropagation();
    aiReply = { ...aiReply, enable: aiReply.enable };
    this.selectedAIReply = aiReply;
    this.clickRow.emit(aiReply);
  }

  public onChangeSelected() {
    this.selectedAIReply = null;
    this.changeSelected.emit();
  }

  public onChangeAutomated(aiReply: IAiReply) {
    this.changeAutomated$.next(aiReply);
  }

  public onEndScroll(event) {
    const element = event?.target as HTMLElement;
    const atBottom =
      element?.scrollHeight - element?.scrollTop === element?.clientHeight;
    if (atBottom) {
      this.endScroll.emit();
    }
  }

  private resetOtherColumns(columnName: string) {
    for (let key in this.sortOrder) {
      if (key !== columnName) {
        this.sortOrder[key] = ESortOrder.default;
        this.columnIcon[key] = 'sortDefault';
      }
    }
  }

  private updateColumnSortState(columnName: string) {
    const sortOrder = this.sortOrder[columnName];
    let newSortOrder, columnIcon;

    if (columnName === EPolicyTableColumnName.updatedAt) {
      newSortOrder =
        sortOrder === ESortOrder.descending
          ? ESortOrder.ascending
          : ESortOrder.descending;
      columnIcon =
        newSortOrder === ESortOrder.descending
          ? 'sortDescendPolicy'
          : 'sortAscendPolicy';
    } else {
      switch (sortOrder) {
        case ESortOrder.default:
          newSortOrder = ESortOrder.descending;
          columnIcon = 'sortDescendPolicy';
          break;
        case ESortOrder.descending:
          newSortOrder = ESortOrder.ascending;
          columnIcon = 'sortAscendPolicy';
          break;
        default:
          newSortOrder = ESortOrder.default;
          columnIcon = 'sortDefault';
      }
    }
    this.sortOrder[columnName] = newSortOrder;
    this.columnIcon[columnName] = columnIcon;

    if (
      (columnName === EPolicyTableColumnName.name ||
        columnName === EPolicyTableColumnName.createdAt) &&
      newSortOrder === ESortOrder.default
    ) {
      this.sortOrder[EPolicyTableColumnName.updatedAt] = ESortOrder.descending;
      this.columnIcon[EPolicyTableColumnName.updatedAt] = 'sortDescendPolicy';
    }
  }

  private emitSortEvent(columnName: string) {
    let emitColumnName = columnName;
    let emitSortOrder = this.sortOrder[columnName];
    if (this.sortOrder[columnName] === ESortOrder.default) {
      emitColumnName = EPolicyTableColumnName.updatedAt;
      emitSortOrder = ESortOrder.descending;
    }
    this.sortEvent.emit({
      columnName: emitColumnName,
      sortOrder: emitSortOrder
    });
  }

  private updateListOfColumns() {
    this.listOfColumn = this.listOfColumn.map((item) => {
      return {
        ...item,
        icon: this.columnIcon[item.key]
      };
    });
  }

  handleSortPolicies(columnName: string) {
    this.resetOtherColumns(columnName);
    this.updateColumnSortState(columnName);
    this.myTable.nativeElement.scrollIntoView();
    this.emitSortEvent(columnName);
    this.updateListOfColumns();
    this._changeDetectorRef.markForCheck();
  }

  private handleSortEvent(columnName: string, sortOrder: ESortOrder) {
    this.resetOtherColumns(columnName);
    switch (columnName) {
      case EPolicyTableColumnName.name:
      case EPolicyTableColumnName.createdAt:
        this.sortOrder[columnName] = sortOrder;
        this.columnIcon[columnName] =
          sortOrder === ESortOrder.descending
            ? 'sortDescendPolicy'
            : 'sortAscendPolicy';
        break;
      case EPolicyTableColumnName.updatedAt:
        this.sortOrder[columnName] = sortOrder;
        this.columnIcon[columnName] =
          sortOrder === ESortOrder.descending
            ? 'sortDescendPolicy'
            : 'sortAscendPolicy';
        this.sortOrder[EPolicyTableColumnName.name] = ESortOrder.default;
        this.sortOrder[EPolicyTableColumnName.createdAt] = ESortOrder.default;
        this.columnIcon[EPolicyTableColumnName.name] = 'sortDefault';
        this.columnIcon[EPolicyTableColumnName.createdAt] = 'sortDefault';
        break;
      default:
        break;
    }
  }

  handleSortByName() {
    this.handleSortPolicies(EPolicyTableColumnName.name);
  }

  handleSortByCreatedDate() {
    this.handleSortPolicies(EPolicyTableColumnName.createdAt);
  }

  handleSortByLastUpdated() {
    this.handleSortPolicies(EPolicyTableColumnName.updatedAt);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.changeAutomated$.complete();
  }
}

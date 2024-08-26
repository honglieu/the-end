import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnDestroy,
  OnInit
} from '@angular/core';
import { GlobalSearchService } from './services/global-search.service';
import {
  BehaviorSubject,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  skip,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { IGlobalSearchConversation } from './interfaces/global-search.interface';
import { isEqual } from 'lodash-es';
import { ModalManagementService } from '@/app/dashboard/services/modal-management.service';
import { SharedService } from '@services/shared.service';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { EConversationType, EMailBoxType } from '@shared/enum';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  providers: [GlobalSearchService]
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  @HostBinding('class.expanded') get expanded() {
    return this.isExpand;
  }

  private loadMore$ = new BehaviorSubject<boolean>(false);

  public isLoading = false;
  private destroy$ = new Subject<void>();
  public visible = false;
  public searchText = '';
  public isExpand = false;
  public isSearchFocus = false;
  public searchResultList: IGlobalSearchConversation[] = [];
  public pageIndex = 1;
  public isLoadingMore = false;
  public isAllConversationFetched = false;
  public isModalOpen = false;
  public selectedBtnType = EConversationType.EMAIL;
  public readonly EConversationType = EConversationType;
  public typeButtonList = [
    {
      name: 'Email',
      type: EConversationType.EMAIL
    },
    {
      name: 'Voicemail',
      type: EConversationType.VOICE_MAIL
    },
    {
      name: 'Trudi® app',
      type: EConversationType.APP
    },
    {
      name: 'SMS',
      type: EConversationType.SMS
    },
    {
      name: 'WhatsApp',
      type: EConversationType.WHATSAPP
    },
    {
      name: 'Messenger',
      type: EConversationType.MESSENGER
    }
  ];
  private justClearSearch = false;

  constructor(
    private globalSearchService: GlobalSearchService,
    private dashboardApiService: DashboardApiService,
    private modalManagementService: ModalManagementService,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private PreventButtonService: PreventButtonService,
    private inboxFilterService: InboxFilterService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.modalManagementService.modalState$,
      this.PreventButtonService.triggerChangeProcess$
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([isCreatingMessage]) => {
          this.isModalOpen =
            !!isCreatingMessage?.length ||
            this.PreventButtonService.isCurrentModalActive;
          this.cdr.detectChanges();
        })
      )
      .subscribe();

    this.globalSearchService.triggerCollapseDropdown$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isExpand = false;
        this.isSearchFocus = false;
      });

    this.companyService
      .getCurrentCompanyId()
      .pipe(
        takeUntil(this.destroy$),
        filter(Boolean),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(() => {
        this.globalSearchService.resetGlobalSearchPayload();
        this.inboxFilterService.setGlobalSearchMailBox([]);
        this.searchText = '';
      });

    combineLatest([
      this.globalSearchService.globalSearchPayload$.pipe(
        distinctUntilChanged((prev, curr) => {
          return isEqual(
            { ...prev, search: prev.search.trim() },
            { ...curr, search: curr.search.trim() }
          );
        }),
        tap(() => {
          this.pageIndex = 1;
          this.isAllConversationFetched = false;
          this.searchResultList = [];
          this.isLoading = !!this.searchText;
        })
      ),
      this.inboxFilterService.getCurrentGlobalSearchMailBox$,
      this.loadMore$.pipe(
        tap((res) => {
          if (res) {
            this.isLoadingMore = true;
            this.pageIndex = this.pageIndex + 1;
          }
        })
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([res]) => !!res.mailBoxIds),
        debounceTime(300),
        switchMap(([payload, mailBoxGlobalSearch]) => {
          this.selectedBtnType =
            payload?.conversationType || EConversationType.EMAIL;
          const newPayload = {
            ...payload,
            page: this.pageIndex,
            pageSize: 10
          };
          if (!this.searchText) return of(null);

          // Scenario 4 in TDI-11770 ticket
          // Skip call api get voice mails and app messages if no mailboxes are selected or
          // the selected mailboxes do not contain a company mailbox
          if (
            mailBoxGlobalSearch.length &&
            !mailBoxGlobalSearch.some(
              (item) => item.type === EMailBoxType.COMPANY
            ) &&
            [EConversationType.VOICE_MAIL, EConversationType.APP].includes(
              payload.conversationType
            )
          ) {
            return of(null);
          }
          return this.dashboardApiService.getGlobalSearchData(newPayload).pipe(
            catchError(() => {
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.isAllConversationFetched = isEqual(
              res.totalPage,
              this.pageIndex
            );
            const newConversationList = [
              ...(this.isLoadingMore ? this.searchResultList : []),
              ...res.conversations
            ];

            this.searchResultList = newConversationList;
            const uniqueConversationIds = [
              ...new Set(
                newConversationList.map(
                  (conversation) => conversation.conversationId
                )
              )
            ];

            const searchListUnique = uniqueConversationIds.map(
              (conversationId) => {
                const conversation = newConversationList?.find(
                  (newConversation) =>
                    newConversation.conversationId === conversationId
                );
                return conversation;
              }
            );
            this.isLoading = false;
            this.isLoadingMore = false;
            this.searchResultList = searchListUnique;
            this.cdr.detectChanges();
          } else {
            this.searchResultList = [];
            this.isLoading = false;
            this.isLoadingMore = false;
            this.cdr.markForCheck();
          }
        }
      });
  }

  handleSearchChange(text: string) {
    this.isSearchFocus = !!text;
    if (this.isSearchFocus) {
      this.sharedService.triggerGlobalSearching();
    }
    this.searchText = text;
    this.globalSearchService.setGlobalSearchPayload({
      search: text
    });
  }

  handleTypeBtnChange(value: EConversationType) {
    if (!value) return;
    this.selectedBtnType = value;
    this.globalSearchService.setGlobalSearchPayload({
      conversationType: value
    });
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonCommonKey.COMMON_SEARCH_GLOBAL,
      EButtonType.COMMON
    );
  }

  handleClickOutside() {
    if (this.justClearSearch) {
      this.justClearSearch = false;
      this.isSearchFocus = false;
      return;
    }
    this.isSearchFocus = false;
    this.isExpand = false;
  }

  handleInputBlur() {
    if (this.isSearchFocus) return;
    this.handleClickOutside();
  }

  handleClearSearch() {
    this.justClearSearch = true;
  }

  handleClick() {
    if (this.shouldHandleProcess()) {
      this.isModalOpen = false;
    } else {
      this.isModalOpen = true;
    }
  }

  handleFocus() {
    this.isExpand = true;
    if (!this.isSearchFocus && !this.searchText) return;
    this.isSearchFocus = true;
    this.sharedService.triggerGlobalSearching();
  }

  handleLoadingMore() {
    this.loadMore$.next(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

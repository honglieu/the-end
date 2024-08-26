import { ActivatedRoute, Router } from '@angular/router';
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  switchMap,
  takeUntil
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  IAiReplyPolicy,
  IPolicyParam
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import { EToastType } from '@/app/toast/toastType';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import { POLICY_ROUTE } from '@/app/dashboard/modules/agency-settings/utils/constants';

@Component({
  selector: 'automated-replies-policy',
  templateUrl: './automated-replies-policy.component.html',
  styleUrls: ['./automated-replies-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutomatedRepliesPolicyComponent implements OnInit, OnDestroy {
  public isEditPolicy: boolean = false;
  public aiReplies: IAiReplyPolicy[] = [];
  public editAiReplyId: string;
  public selectedAiReplies: IAiReplyPolicy[] = [];
  public isLoadingNew: boolean = false;
  public isFiltering: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();
  public search: string = '';
  private limit: number = 20;
  public aiRepliesPopupState = {
    openPanel: false,
    delete: false
  };
  public getListAiReplies$ = new BehaviorSubject<boolean>(true);
  public isDeselectAIReply: boolean = false;
  public isMailboxOwner: boolean = false;
  public disabledAiSettings: boolean = false;
  public isChangeParamSort = false;
  public isLoading = true;
  public permissionToEdit: boolean = false;
  public isNoPolices: boolean = true;
  public removeClass: boolean = false;
  private policyFilterChange$ = combineLatest([
    this.aiPolicyService.aiReplyPolicySearchValue$,
    this.aiPolicyService.sortEvent$,
    this.getListAiReplies$
  ]);
  private defaultQueryParams: IPolicyParam;

  private readonly filterRouterFn = () => {
    const policyRoute = POLICY_ROUTE;
    return this.router.url.includes(policyRoute);
  };
  public outOfData: boolean = false;

  constructor(
    private aiPolicyService: AiPolicyService,
    private _changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.handleSetDefaultQueryParams();
    this.subscribeListAiReplies();
  }

  subscribeListAiReplies() {
    this.policyFilterChange$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$),
        switchMap(([search, sortEvent, isNewList]) => {
          const payload = this.getPayloadToGetAiReply(
            sortEvent,
            search,
            isNewList
          );
          return this.aiPolicyService.getListAiRepliesPolicy(payload);
        })
      )
      .subscribe((res) => {
        if (!res) return;
        const { response } = res || {};
        const limitData = 20;
        this.outOfData = response?.length < limitData;
        this.aiReplies = [...this.aiReplies, ...response];
        this.isNoPolices = !!this.aiReplies?.length;
        this.isLoading = false;
        this.isLoadingNew = false;
        this.isFiltering = false;
        this.isChangeParamSort = false;
        this.permissionToEdit = this.aiPolicyService.hasPermissionToEdit;
        this._changeDetectorRef.markForCheck();
      });
  }

  handleSearch() {
    this.aiPolicyService.aiReplyPolicySearchValue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.search = search;
        this.getListAiReplies(true);
        if (this.aiReplies?.length && this.search) this.isNoPolices = false;
      });
  }

  getPayloadToGetAiReply(sortEvent, search, isNewList) {
    const payload = {
      orderBy: {
        column: sortEvent.columnName,
        order: sortEvent.sortOrder
      },
      search,
      limit: this.limit,
      lastValue:
        this.aiReplies[this.aiReplies.length - 1]?.[sortEvent.columnName]
    };
    if (isNewList) {
      delete payload.lastValue;
    }
    return payload;
  }

  addPolicy() {
    this.setPopupState({
      openPanel: true
    });
    this.isEditPolicy = false;
    this.editAiReplyId = null;
    this._changeDetectorRef.markForCheck();
  }

  private getListAiReplies(isNewList: boolean) {
    if (!isNewList) {
      this.isLoadingNew = true;
    }
    this.getListAiReplies$.next(isNewList);
  }

  public onEndScroll() {
    if (this.isLoadingNew || this.outOfData) return;
    this.getListAiReplies(false);
  }

  public onClickRow(aiReply: IAiReplyPolicy) {
    this.isDeselectAIReply = false;
    this.removeClass = false;
    this.editAiReplyId = aiReply.id;
    this.isEditPolicy = true;
    this._changeDetectorRef.markForCheck();
    this.setPopupState({ openPanel: true });
    this.clearSelected();
  }

  setPopupState(state: Partial<typeof this.aiRepliesPopupState>) {
    this.aiRepliesPopupState = {
      ...this.aiRepliesPopupState,
      ...state
    };
  }

  public onChangeSelected() {
    this.setListSelected();
    this.setPopupState({
      openPanel: false
    });
  }

  public onCloseSelected() {
    this.clearSelected();
  }

  public setListSelected() {
    this.selectedAiReplies = this.aiReplies.filter((ai) => ai.selected);
  }

  private clearSelected() {
    this.selectedAiReplies.forEach((ai) => (ai.selected = false));
    this.setListSelected();
  }

  deletePolicy() {
    this.aiReplies = this.aiReplies.filter(
      (item) => this.editAiReplyId !== item.id
    );
    this.editAiReplyId = null;
    this._changeDetectorRef.markForCheck();
  }

  handleSavePolicy() {
    this.aiReplies = [];
    this.isFiltering = true;
    this.getListAiReplies(true);
  }

  handleClearSearch() {
    this.search = '';
    this.aiReplies = [];
    this.aiPolicyService.setAIReplyPolicySearchValue('');
    this.isFiltering = true;
    this.getListAiReplies(true);
  }

  handleSearchAiPolicy(event) {
    event.target.blur();
    this.aiReplies = [];
    this.isFiltering = true;
    this.aiPolicyService.setAIReplyPolicySearchValue(this.search);
    this.getListAiReplies(true);
  }

  updateQuestionAndAnswer(update) {
    this.setPopupState({ openPanel: false });
    this.isDeselectAIReply = true;
    const index: number = this.aiReplies.findIndex((ai) => ai.id === update.id);
    this.aiReplies[index] = update;
  }

  handleSetDefaultQueryParams() {
    this.activatedRoute.queryParams
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$),
        filter(this.filterRouterFn)
      )
      .subscribe((params) => {
        if (
          params['search'] === this.defaultQueryParams?.search &&
          params['columnName'] === this.defaultQueryParams?.columnName &&
          params['sortOrder'] === this.defaultQueryParams?.sortOrder
        ) {
          return;
        }
        this.defaultQueryParams = {
          search: params['search'],
          columnName: params['columnName'],
          sortOrder: params['sortOrder']
        };
        this.router
          .navigate([], {
            queryParams: this.defaultQueryParams,
            relativeTo: this.activatedRoute,
            replaceUrl: true
          })
          .then(() => {
            this.subscribePolicyFilterChange();
            this.aiPolicyService.setAIReplyPolicySearchValue(
              this.defaultQueryParams['search']
            );
            this.aiPolicyService.setSortEvent$({
              columnName: this.defaultQueryParams['columnName'],
              sortOrder: this.defaultQueryParams['sortOrder']
            });
          });
      });
    this.setParamsToService();
  }

  setParamsToService() {
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((queryParams) => {
          this.subscribeQueryParamMap(queryParams);
          return (
            !Boolean(
              queryParams &&
                queryParams['search'] &&
                queryParams['columnName'] &&
                queryParams['sortOrder']
            ) && this.filterRouterFn()
          );
        })
      )
      .subscribe(() => {
        const queryParams = this.aiPolicyService.toQueryParams();
        this.router.navigate([], {
          queryParams: queryParams,
          relativeTo: this.activatedRoute,
          replaceUrl: true
        });
      });
  }

  subscribePolicyFilterChange() {
    this.policyFilterChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(([search, _]) => {
        this.search = search;
        const queryParams = this.aiPolicyService.toQueryParams();
        this.router.navigate([], {
          queryParams: queryParams,
          relativeTo: this.activatedRoute,
          replaceUrl: true
        });
      });
  }

  handleSortEvent(event: { columnName: string; sortOrder: string }) {
    this.isFiltering = true;
    this.outOfData = false;
    this.aiPolicyService.setSortEvent$(event);
    this.aiReplies = [];
    this.isChangeParamSort = true;
    this.getListAiReplies(true);
  }

  handleCloseDrawer(event) {
    this.editAiReplyId = null;
    this.setPopupState({ openPanel: event });
    this.removeClass = true;
  }

  subscribeQueryParamMap(params) {
    const isOpenPanel = params['openPolicyPanel'];
    const aiReplyNoti = params['policyId'];
    if (!isOpenPanel || !aiReplyNoti) return;
    this.editAiReplyId = aiReplyNoti;
    this.isEditPolicy = true;
    this._changeDetectorRef.markForCheck();
    this.setPopupState({ openPanel: isOpenPanel === 'true' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.getListAiReplies$.complete();
  }
}

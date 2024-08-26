import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import dayjs from 'dayjs';
import { Subject, combineLatest, finalize, switchMap, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { UserService } from '@/app/dashboard/services/user.service';
import {
  LIMIT_TASK_LIST,
  SCROLL_THRESHOLD_TABLE
} from '@/app/dashboard/utils/constants';
import { SHORT_ISO_DATE, UserType } from '@services/constants';
import { PromotionsApiService } from '@/app/console-setting/promotions/services/promotions-api.service';
import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import { getVariant } from '@/app/console-setting/promotions/utils/helper';
import {
  IPromotion,
  IPromotionOption,
  IPromotions
} from '@/app/console-setting/promotions/utils/promotions.interface';
import {
  EPromotionPopupType,
  EPromotionStatus
} from '@/app/console-setting/promotions/utils/type';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'list-view-promotions',
  templateUrl: './list-view-promotions.component.html',
  styleUrls: ['./list-view-promotions.component.scss']
})
export class ListViewPromotionsComponent implements OnInit, OnDestroy {
  @ViewChild('table', { static: false })
  viewPort: ElementRef;
  private unsubscribe = new Subject<void>();
  public promotionOption: IPromotionOption[];
  public listPromotions: IPromotion[] = [];
  public promotions: IPromotions;
  public isLoading: boolean = true;
  public isLoadingMore: boolean = false;
  public isCompletedScroll = false;
  public scrollThresholdTable = SCROLL_THRESHOLD_TABLE;
  public pageIndex: number = 0;
  public pageSize: number = LIMIT_TASK_LIST;
  public totalItems: number = 0;
  public totalPages: number = 0;
  public orderBy: string = '';
  public dataPromotions: IPromotion[] = [];
  public currentPromotionsList: IPromotion[] = [];
  public currentUserType: string = '';
  public userType = UserType;
  public houses = {
    amHouse: ', 12:01 am',
    pmHouse: ', 11:59 pm'
  };
  public isShowPromotionsModal: boolean = false;
  public promotionsData = {};
  public selectedRowId: string = '';
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;

  public listOfColumn = [
    {
      title: 'Title',
      width: '464px'
    },
    {
      title: 'Items',
      width: '88px'
    },
    {
      title: 'Start',
      width: '200px',
      time: 'time',
      sortDirections: ['descend', 'ascend', null],
      compare: (a: IPromotion, b: IPromotion) => this.handleSortStartDate(a, b),
      nzSortOrder: false
    },
    {
      title: 'End',
      width: '200px'
    },
    {
      width: '132px',
      title: 'Status'
    },
    {
      title: '',
      width: '132px'
    }
  ];
  public isFormatTimeText: string = '';
  public needToRefresh: boolean = false;
  public timeZone: string = '';

  constructor(
    public promotionsService: PromotionsService,
    public promotionsApiService: PromotionsApiService,
    public userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.timeZone = company.timeZone;
        this.getPromotions(0, true);
      });

    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentUserType = res?.type;
      });
    this.promotionsService
      .getPromotionsList()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listPromotions) => {
        if (!listPromotions) return;
        this.selectedRowId = '';
        this.currentPromotionsList = listPromotions;
        this.listPromotions = this.handleFormatDataPromotion(listPromotions);
      });
    this.promotionsService
      .getRefreshPromotionsList()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((needToRefresh) => {
        this.needToRefresh = needToRefresh;
        this.selectedRowId = '';
      });
    this.promotionsService.addPromotionSuccess$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.listOfColumn[2].nzSortOrder = true;
        this.getPromotions(0, true);
        this.selectedRowId = '';
      });
  }

  getPromotions(pageIndex: number, isLoading?: boolean) {
    this.isLoading = isLoading;

    const restrictedDates$ =
      this.promotionsApiService.getPromotionRestrictedDates();
    const listPromotion$ =
      this.promotionsApiService.getListPromotions(pageIndex);

    combineLatest([listPromotion$, restrictedDates$])
      .pipe(
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.isCompletedScroll = true;
          this.needToRefresh = false;
        })
      )
      .subscribe(([listPromotions, listRestrictedDate]) => {
        const listFormatPromotions = {
          ...listPromotions,
          items: listPromotions.items.map((item) => {
            return {
              ...item,
              promotionCarousels: item.promotionCarousels.sort(
                (a, b) => a.order - b.order
              )
            };
          })
        };
        this.promotions = listFormatPromotions;
        const { currentPage, items, totalItems, totalPages } =
          listFormatPromotions;
        this.totalItems = +totalItems;
        this.pageIndex = +currentPage;
        this.totalPages = +totalPages;
        const isFirstPage = +currentPage === 0;
        this.dataPromotions = [
          ...(isFirstPage ? [] : this.dataPromotions),
          ...items
        ];
        this.currentPromotionsList = this.dataPromotions;

        this.listPromotions = this.handleFormatDataPromotion(
          this.dataPromotions
        );
        this.promotionsService.setListRestrictedDates(listRestrictedDate);
        this.promotionsService.setPromotionsList(this.currentPromotionsList);
      });
  }

  handleFormatDataPromotion(promotions: IPromotion[]): IPromotion[] {
    const listFormatPromotions = promotions.map((item) => {
      const status = this.promotionsStatus(item);
      return {
        ...item,
        status,
        variant: getVariant(status),
        promotionCarousels: item.promotionCarousels.sort(
          (a, b) => a.order - b.order
        )
      };
    });
    return listFormatPromotions;
  }

  promotionsStatus({ publishedAt, unpublishedAt }) {
    const currentDate = dayjs().tz(this.timeZone).format(SHORT_ISO_DATE);
    if (publishedAt.localeCompare(currentDate) === 1) {
      return EPromotionStatus.SCHEDULED;
    }
    if (unpublishedAt.localeCompare(currentDate) === -1) {
      return EPromotionStatus.UNPUBLISHED;
    }
    return EPromotionStatus.PUBLISHED;
  }

  refreshList() {
    this.getPromotions(0, true);
  }

  handleClickRow($event: Event, data: IPromotion) {
    if (this.currentUserType !== this.userType.ADMIN) return;
    if (
      ($event.target as HTMLElement).classList.contains(
        'toolbar-icon-deleted'
      ) ||
      ($event.target as HTMLElement).classList.contains('toolbar-icon-preview')
    ) {
      $event.stopPropagation();
    } else {
      this.selectedRowId = data.id;
      this.promotionsService.setPopupPromotionsInfo({
        type: EPromotionPopupType.EDIT_PROMOTION,
        option: {
          ...data,
          promotionCarousels: data.promotionCarousels.sort(
            (a, b) => a.order - b.order
          )
        }
      });
    }
  }

  handelPreviewPromotion($event, data?) {
    $event.stopPropagation();
    if (!data) return;
    const infoCarousels = data?.promotionCarousels.sort(
      (a, b) => a.order - b.order
    );
    this.promotionsData = {
      country: data.country,
      promotionCarousels: infoCarousels,
      publishDate: data?.publishedAt,
      title: data?.title,
      unpublishDate: data?.unpublishedAt
    };
    this.isShowPromotionsModal = true;
  }

  closePromotionModal() {
    this.isShowPromotionsModal = false;
    this.selectedRowId = '';
  }

  handelDeletePromotion($event: Event, data: IPromotion) {
    $event.stopPropagation();
    if (this.currentUserType === this.userType.ADMIN) {
      this.promotionsApiService
        .deletePromotion(data.id)
        .pipe(
          takeUntil(this.unsubscribe),
          switchMap(() =>
            this.promotionsApiService.getPromotionRestrictedDates()
          )
        )
        .subscribe((res) => {
          if (!res) return;
          const listPromotionsAfterRemoved = this.currentPromotionsList.filter(
            (item) => item.id !== data.id
          );
          this.promotionsService.setPromotionsList(listPromotionsAfterRemoved);
          this.promotionsService.setListRestrictedDates(res);
        });
    }
  }

  handleSortStartDate(a: IPromotion, b: IPromotion) {
    const dayStart = new Date(a.publishedAt);
    const dayEnd = new Date(b.publishedAt);
    this.listOfColumn[2].nzSortOrder = false;
    return dayStart.getTime() - dayEnd.getTime();
  }

  onScrollDown() {
    const { totalItems, totalPages } = this.promotions;
    if (
      this.dataPromotions.length >= totalItems &&
      (this.pageIndex as number) + 1 >= totalPages
    ) {
      return;
    }
    const element = this.viewPort?.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.scrollThresholdTable &&
      this.pageIndex < totalPages &&
      this.isCompletedScroll
    ) {
      this.getPromotions(+this.pageIndex + 1);
      this.isLoadingMore = true;
      this.isCompletedScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

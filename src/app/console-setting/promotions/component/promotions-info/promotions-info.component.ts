import { Component, OnInit } from '@angular/core';
import { FormArray } from '@angular/forms';
import dayjs from 'dayjs';
import { Subject, finalize, forkJoin, switchMap, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { ECountryFull } from '@shared/enum/region.enum';
import { PromotionsApiService } from '@/app/console-setting/promotions/services/promotions-api.service';
import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import {
  IPromotion,
  IPromotionSchedule
} from '@/app/console-setting/promotions/utils/promotions.interface';
import {
  EPromotionPopupType,
  EPromotionStatus
} from '@/app/console-setting/promotions/utils/type';

@DestroyDecorator
@Component({
  selector: 'promotions-info',
  templateUrl: './promotions-info.component.html',
  styleUrls: ['./promotions-info.component.scss']
})
export class PromotionsInfoComponent implements OnInit {
  private destroy$ = new Subject<void>();
  titles: string[] = [];
  public promotionId: string;
  public listRestrictedDates: IPromotionSchedule[];
  public isRmEnvironment: boolean;
  public isDisableSave: boolean;
  public isCreatePromotion: boolean;
  public readonly COUNTRY = ECountryFull;
  public trudiDrawerConfig = {
    visible: false,
    enableBackBtn: true,
    enableOkBtn: true,
    enableDeleteBtn: false
  };
  public showPromotionsPopup: boolean = false;
  public isRestricted: boolean = false;
  public isShowPromotionsModal: boolean = false;
  public promotionsData = {};
  public currentPromotionList: IPromotion[] = [];
  public promotionInfo: IPromotion;
  public isChangePublishDate: boolean = false;
  public isChangeUnpublishDate: boolean = false;
  public invalidPublishDate: boolean = false;
  public needToRefresh: boolean = false;
  public needToRefreshList: boolean = false;

  constructor(
    public promotionsService: PromotionsService,
    public promotionsApiService: PromotionsApiService,
    public agencyService: AgencyService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.promotionsService.buildFormPromotion();
    this.getListTitles();
    this.promotionsService.infoCarousel.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getListTitles();
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });

    this.promotionsService
      .getPopupPromotionsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stage) => {
        if (!stage) return;
        this.promotionInfo = stage['option'];
        this.triggerPromotionPopup(stage['type'], stage['option']);
      });

    this.getListRestrictedDates();

    this.promotionsService
      .getPromotionsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((listPromotions) => {
        if (!listPromotions) return;
        this.currentPromotionList = listPromotions;
      });
  }

  get promotionsForm() {
    return this.promotionsService.promotionForm;
  }

  get titleName() {
    return this.promotionsForm.get('titleName');
  }

  get country() {
    return this.promotionsForm.get('country');
  }

  get publishDate() {
    return this.promotionsForm.get('publishDate');
  }

  get unpublishDate() {
    return this.promotionsForm.get('unpublishDate');
  }

  get infoCarousel(): FormArray {
    return this.promotionsForm.get('infoCarousel') as FormArray;
  }

  getListRestrictedDates() {
    this.promotionsService
      .getListRestrictedDates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((listRestrictedDates: IPromotionSchedule[]) => {
        if (!listRestrictedDates.length) return;
        this.listRestrictedDates = listRestrictedDates;
      });
  }

  refreshList() {
    const restrictedDates =
      this.promotionsApiService.getPromotionRestrictedDates();
    const listPromotion = this.promotionsApiService.getListPromotions(0);
    forkJoin([listPromotion, restrictedDates])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.handleResetForm();
        })
      )
      .subscribe(([listPromotion, restrictedDates]) => {
        this.promotionsService.setPromotionsList(listPromotion.items);
        this.promotionsService.setListRestrictedDates(restrictedDates);
        this.promotionsService.setRefreshPromotionsList(false);
      });
  }

  handlePreview() {
    this.promotionsForm.markAllAsTouched();
    if (this.promotionsForm.invalid) {
      return;
    }
    const listCarousel = this.promotionsForm.value.infoCarousel
      .filter((item) => {
        return item.featureName;
      })
      .sort((a, b) => a.order - b.order);
    this.promotionsData = {
      ...this.promotionsForm.value,
      promotionCarousels: listCarousel,
      title: this.promotionsForm.value.titleName
    };
    this.isShowPromotionsModal = true;
  }

  getListTitles() {
    this.titles = this.promotionsService.getCarouselTitles(
      this.promotionsService.infoCarousel.length
    );
  }

  handleValidatePromotion(
    $event,
    isChangePublishDate: boolean,
    isChangeUnpublishDate: boolean
  ) {
    let comparePublishAndUnpublishDate = true;
    if (this.promotionsForm.value.status === EPromotionStatus.UNPUBLISHED) {
      comparePublishAndUnpublishDate = dayjs(
        this.publishDate?.value
      ).isSameOrBefore(dayjs(this.unpublishDate?.value));
    }
    if (
      !this.isCreatePromotion &&
      $event &&
      this.publishDate.valid &&
      this.unpublishDate.valid &&
      isChangePublishDate &&
      isChangeUnpublishDate &&
      comparePublishAndUnpublishDate
    ) {
      this.isDisableSave = false;
    }
    this.isDisableSave =
      !(
        comparePublishAndUnpublishDate &&
        isChangePublishDate &&
        isChangeUnpublishDate
      ) && this.promotionsForm.value.status === EPromotionStatus.UNPUBLISHED;
  }

  allConditionsDateChange() {
    return (
      this.publishDate.value &&
      this.unpublishDate.value &&
      (this.isChangePublishDate || this.isChangeUnpublishDate)
    );
  }

  handleNotAlowSelectDate() {
    if (this.allConditionsDateChange()) {
      const unpublishedDayjs = dayjs(this.unpublishDate.value).startOf('day');
      const publishedDayjs = dayjs(this.publishDate.value).startOf('day');
      this.isRestricted = this.listRestrictedDates.some((date) => {
        const publishedAt = dayjs(date.publishedAt).startOf('day');

        return (
          publishedDayjs.isSameOrBefore(publishedAt) &&
          unpublishedDayjs.isSameOrAfter(publishedAt)
        );
      });
      if (this.isRestricted) {
        this.publishDate.markAllAsTouched();
        this.publishDate.setErrors({ invalidPublishDate: true });
        this.invalidPublishDate = true;
      } else {
        this.publishDate.setErrors(null);
        this.invalidPublishDate = false;
      }
    } else {
      this.publishDate.setErrors(null);
      this.isRestricted = false;
      this.invalidPublishDate = false;
    }
  }

  handleValidatePublishDate($event) {
    const publishDateAt = dayjs(this.promotionInfo?.publishedAt);
    const publishDate = dayjs(this.publishDate?.value);
    this.isChangePublishDate = !publishDateAt.isSame(publishDate, 'day');
    this.handleValidatePromotion(
      publishDate.toDate(),
      this.isChangePublishDate,
      this.isChangeUnpublishDate
    );
    this.handleNotAlowSelectDate();
  }

  handleValidateUnpublishDate($event) {
    const unpublishedAt = dayjs(this.promotionInfo?.unpublishedAt);
    const unpublishDate = dayjs(this.unpublishDate?.value);
    this.isChangeUnpublishDate = !unpublishedAt.isSame(unpublishDate, 'day');
    this.handleValidatePromotion(
      unpublishDate.toDate(),
      this.isChangePublishDate,
      this.isChangeUnpublishDate
    );
    this.handleNotAlowSelectDate();
  }

  handleCancel() {
    this.promotionsService.setRefreshPromotionsList(this.needToRefreshList);
    this.getListRestrictedDates();
    this.handleResetForm();
  }

  handleResetForm() {
    this.needToRefresh = false;
    this.trudiDrawerConfig.visible = false;
    this.promotionsForm.reset();
    this.promotionsForm.markAsUntouched();
    this.promotionsForm.markAsPristine();
    this.promotionsService.setPopupPromotionsInfo(null);
    this.isChangePublishDate = false;
    this.isChangeUnpublishDate = false;
    this.isDisableSave = false;
  }

  handleSave() {
    this.promotionsForm.markAllAsTouched();
    if (this.promotionsForm.invalid) {
      return;
    }
    this.country.patchValue(
      this.isRmEnvironment ? this.COUNTRY.UNITED_STATES : this.COUNTRY.AUSTRALIA
    );
    const restrictedDates =
      this.promotionsApiService.getPromotionRestrictedDates();
    const listPromotion = this.promotionsApiService.getListPromotions(0);
    const payload = {
      ...this.promotionsService.getPayloadPromotions()
    };
    if (this.isCreatePromotion) {
      this.promotionsApiService
        .savePromotion(payload)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            return forkJoin([restrictedDates, listPromotion]);
          })
        )
        .subscribe(
          ([restrictedDates, listPromotion]) => {
            if (!restrictedDates || !listPromotion) return;
            this.promotionsService.setListRestrictedDates(restrictedDates);
            this.promotionsService.addPromotionSuccess.next(true);
            this.handleResetForm();
          },
          (error) => {
            this.needToRefresh = true;
            this.needToRefreshList = true;
            this.promotionsService.setRefreshPromotionsList(true);
          }
        );
    } else {
      let promotionUpdated = {};
      this.promotionsApiService
        .updatePromotion(this.promotionId, payload)
        .pipe(
          takeUntil(this.destroy$),
          switchMap((res) => {
            promotionUpdated = res;
            return restrictedDates;
          })
        )
        .subscribe(
          (restrictedDates) => {
            if (!restrictedDates) return;
            const currentPromotionListAfterUpdated =
              this.currentPromotionList.map((item) => {
                return {
                  ...item,
                  ...(item.id === this.promotionId ? promotionUpdated : {})
                };
              });
            this.promotionsService.setPromotionsList(
              currentPromotionListAfterUpdated
            );
            this.promotionsService.setListRestrictedDates(restrictedDates);
            this.handleResetForm();
          },
          (error) => {
            this.needToRefresh = true;
            this.needToRefreshList = true;
          }
        );
    }
  }

  handleDeleted() {
    this.promotionsApiService
      .deletePromotion(this.promotionId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.promotionsApiService.getPromotionRestrictedDates()
        ),
        finalize(() => this.handleResetForm())
      )
      .subscribe((res) => {
        const listPromotionsAfterRemoved = this.currentPromotionList.filter(
          (item) => item.id !== this.promotionId
        );
        this.promotionsService.setPromotionsList(listPromotionsAfterRemoved);
        this.promotionsService.setListRestrictedDates(res);
      });
  }

  unpublishedDate = (current: Date): boolean => {
    const currentDate = dayjs().startOf('day');
    const unpublishedDateJS = dayjs(current).startOf('day');
    const publishDate = dayjs(this.publishDate.value);

    const isBeforeCurrentDate = unpublishedDateJS.isBefore(currentDate);

    const isBeforePublishedDate = unpublishedDateJS.isBefore(
      publishDate,
      'day'
    );

    if (!this.isCreatePromotion) {
      this.listRestrictedDates = this.listRestrictedDates.filter(
        (item) =>
          !dayjs(item.publishedAt).isSame(dayjs(this.publishDate.value), 'day')
      );
    }

    const isWithinRange = this.listRestrictedDates?.some((dateRange) => {
      const publishedAt = dayjs(dateRange.publishedAt).startOf('day');
      const unpublishedAt = dayjs(dateRange.unpublishedAt).endOf('day');
      return (
        unpublishedDateJS.isSameOrAfter(publishedAt) &&
        unpublishedDateJS.isSameOrBefore(unpublishedAt)
      );
    });

    return isBeforeCurrentDate || isBeforePublishedDate || isWithinRange;
  };

  publishedDate = (current: Date): boolean => {
    const currentDate =
      this.agencyDateFormatService.initTimezoneToday().nativeDate;

    const publishedDayjs = dayjs(current).startOf('day');

    const unpublishDate = dayjs(this.unpublishDate.value);
    const isBeforeCurrentDate = publishedDayjs.isSameOrBefore(currentDate);

    const isAfterUnpublishDate =
      this.promotionsForm.value.status !== EPromotionStatus.UNPUBLISHED &&
      publishedDayjs.isAfter(unpublishDate, 'day');

    if (!this.isCreatePromotion) {
      this.listRestrictedDates = this.listRestrictedDates.filter(
        (item) =>
          !dayjs(item.publishedAt).isSame(dayjs(this.publishDate.value), 'day')
      );
    }

    const isWithinRange = this.listRestrictedDates?.some((dateRange) => {
      const publishedAt = dayjs(dateRange.publishedAt).startOf('day');
      const unpublishedAt = dayjs(dateRange.unpublishedAt).endOf('day');
      return (
        publishedDayjs.isSameOrAfter(publishedAt) &&
        publishedDayjs.isSameOrBefore(unpublishedAt)
      );
    });
    return isBeforeCurrentDate || isAfterUnpublishDate || isWithinRange;
  };

  triggerPromotionPopup(type: EPromotionPopupType, option?: IPromotion) {
    switch (type) {
      case EPromotionPopupType.CREATE_NEW_PROMOTION:
        this.trudiDrawerConfig.visible = true;
        this.isCreatePromotion = true;
        this.isDisableSave = false;
        this.isRestricted = false;
        break;
      case EPromotionPopupType.EDIT_PROMOTION:
        this.isCreatePromotion = false;
        this.promotionId = option?.id;
        this.trudiDrawerConfig.visible = true;
        this.isDisableSave = option?.status === EPromotionStatus.UNPUBLISHED;
        this.promotionsService.handlePatchFormPromotions(option);
        this.isRestricted = false;
        break;
      default:
        this.trudiDrawerConfig.visible = false;
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

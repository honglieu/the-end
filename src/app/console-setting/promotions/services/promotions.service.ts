import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import dayjs from 'dayjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { PROTOCOL, SHORT_ISO_DATE } from '@services/constants';
import { ShareValidators } from '@shared/validators/share-validator';
import {
  IPromotion,
  IPromotionOption,
  IPromotionSchedule
} from '@/app/console-setting/promotions/utils/promotions.interface';
import {
  DEFAULT_CAROUSEL_PROMOTIONS,
  EPromotionPopupType,
  EUploadFileError
} from '@/app/console-setting/promotions/utils/type';
import { LocalFile } from '@services/files.service';
@Injectable({
  providedIn: 'root'
})
export class PromotionsService {
  public promotionForm: FormGroup;
  public popupPromotionsInfo$: BehaviorSubject<
    EPromotionPopupType | IPromotionOption
  > = new BehaviorSubject<EPromotionPopupType | IPromotionOption>(null);
  private listRestrictedDates: BehaviorSubject<IPromotionSchedule[]> =
    new BehaviorSubject<IPromotionSchedule[]>([]);
  public promotionsList$: BehaviorSubject<IPromotion[]> = new BehaviorSubject<
    IPromotion[]
  >([]);
  public isRefreshPromotionsList: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private currentPromotionId: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public addPromotionSuccess = new BehaviorSubject<boolean>(null);
  public addPromotionSuccess$ = this.addPromotionSuccess.asObservable();
  public promotionUploadedFile = new BehaviorSubject<LocalFile>(null);
  public promotionUploadedFile$ = this.promotionUploadedFile.asObservable();
  constructor(private formBuilder: FormBuilder) {}

  setPromotionId(promotionId: string) {
    this.currentPromotionId.next(promotionId);
  }

  getPromotionId() {
    return this.currentPromotionId.asObservable();
  }

  setListRestrictedDates(value: IPromotionSchedule[]) {
    this.listRestrictedDates.next(value);
  }

  getListRestrictedDates(): Observable<IPromotionSchedule[]> {
    return this.listRestrictedDates.asObservable();
  }

  buildFormPromotion(): void {
    this.promotionForm = this.formBuilder.group({
      titleName: ['', Validators.required],
      country: [''],
      status: [''],
      publishDate: ['', Validators.required],
      unpublishDate: ['', Validators.required],
      infoCarousel: this.formBuilder.array([])
    });

    this.addThreeCarouselItems();
  }

  get infoCarousel(): FormArray {
    return this.promotionForm.get('infoCarousel') as FormArray;
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  handleFormatProtocol(url: string) {
    if (url === '') return url;

    const regexWebsite = /^https?:\/\//;

    if (regexWebsite.test(url)) {
      return url;
    }

    return `${PROTOCOL}${url}`;
  }

  getCarouselTitles(count: number): string[] {
    return Array.from({ length: count }, (_, index) =>
      this.getCarouselTitle(index)
    );
  }

  getCarouselTitle(index: number): string {
    const titles = [
      '1st item in carousel',
      '2nd item in carousel (optional)',
      '3rd item in carousel (optional)'
    ];
    return titles[index] || `${index + 1}th item in carousel`;
  }

  addThreeCarouselItems(): void {
    Array.from({ length: DEFAULT_CAROUSEL_PROMOTIONS }, (_, index) =>
      this.addCarouselItem(index)
    );
  }

  addCarouselItem(isFirstItem: number): void {
    const validatorRequired = isFirstItem === 0 ? [Validators.required] : [];
    const validatorGroup =
      isFirstItem === 0
        ? []
        : [
            this.requiredInGroup(['featureName', 'description', 'image', 'url'])
          ];
    const carouselItem = this.formBuilder.group(
      {
        id: [''],
        image: ['', isFirstItem === 0 ? this.requiredFilesValidator() : []],
        featureName: ['', validatorRequired],
        description: ['', validatorRequired],
        url: ['', ShareValidators.websiteUrl()],
        urlDisplay: ['']
      },
      {
        validators: validatorGroup
      }
    );
    this.infoCarousel.push(carouselItem);
  }

  requiredFilesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const [value] = control.value || [];
      if ([EUploadFileError.FILE_TOO_LARGES].includes(value?.errorType)) {
        return { filesTooLarges: true };
      }
      if ([EUploadFileError.FILE_INVALID_TYPE].includes(value?.errorType)) {
        return { filesTypeSupport: true };
      }
      if (Array.isArray(control.value) && control.value.length > 0) {
        return null;
      }
      return { requiredFiles: true };
    };
  }

  requiredInGroup(pairControlNames: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const controls = pairControlNames.map((name) => control.get(name));
      const someControlsHaveValue = controls.some(
        (control) => control?.value && control.value.length > 0
      );

      controls.forEach((control) => {
        const errors = control.errors || {};
        delete errors['required'];
        delete errors['requiredFiles'];

        if (someControlsHaveValue) {
          if (!control.value?.length) {
            control.setErrors({
              ...errors,
              required: true,
              requiredFiles: true
            });
          } else {
            control.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
        } else {
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      });

      if (pairControlNames.includes('url')) {
        const controlUrl = control.get('url');
        const errorsUrl = controlUrl.errors || {};
        delete errorsUrl['required'];
        delete errorsUrl['requiredFiles'];
        controlUrl.setErrors(
          Object.keys(errorsUrl).length > 0 ? errorsUrl : null
        );
      }

      return null;
    };
  }

  getPayloadPromotions() {
    const { value: promotionCarousels } = this.infoCarousel || {};
    const transformedCarousels = promotionCarousels
      .map((carousel, index) => {
        const { description, featureName, image, url, urlDisplay, id } =
          carousel || {};
        const order = index + 1;
        if (featureName || description) {
          return {
            ...(id && { id }),
            image,
            url: this.handleFormatProtocol(url),
            order,
            urlDisplay,
            featureName,
            description
          };
        }

        return null;
      })
      .filter(Boolean);

    return {
      title: this.promotionForm.get('titleName')?.value,
      publishedAt: dayjs(this.promotionForm.get('publishDate')?.value).format(
        SHORT_ISO_DATE
      ),
      country: this.promotionForm.get('country')?.value,
      unpublishedAt: dayjs(
        this.promotionForm.get('unpublishDate')?.value
      ).format(SHORT_ISO_DATE),
      promotionCarousels: transformedCarousels
    };
  }

  getPopupPromotionsInfo(): Observable<EPromotionPopupType | IPromotionOption> {
    return this.popupPromotionsInfo$.asObservable();
  }

  setPopupPromotionsInfo(value: EPromotionPopupType | IPromotionOption) {
    this.popupPromotionsInfo$.next(value);
  }

  generateDateObject(date: string) {
    if (!date) return '';
    const todayInDayJS = dayjs(date);
    const today = new Date();
    today.setFullYear(todayInDayJS.year());
    today.setMonth(todayInDayJS.month());
    today.setDate(todayInDayJS.date());
    return today;
  }

  handlePatchFormPromotions(data: IPromotion) {
    const { promotionCarousels, publishedAt, title, unpublishedAt, status } =
      data || {};
    this.promotionForm.patchValue({
      infoCarousel: this.infoCarousel.patchValue(promotionCarousels || []),
      publishDate: this.generateDateObject(publishedAt),
      titleName: title,
      unpublishDate: this.generateDateObject(unpublishedAt),
      status: status
    });
  }

  getPromotionsList(): Observable<IPromotion[]> {
    return this.promotionsList$.asObservable();
  }

  setPromotionsList(value: IPromotion[]) {
    this.promotionsList$.next(value);
  }

  getRefreshPromotionsList(): Observable<boolean> {
    return this.isRefreshPromotionsList.asObservable();
  }

  setRefreshPromotionsList(value: boolean) {
    this.isRefreshPromotionsList.next(value);
  }
}

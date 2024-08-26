import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { listAgencyLogoTypeDot, UploadErrorMsg } from '@services/constants';
import { LoadingService } from '@services/loading.service';
import { SharedService } from '@services/shared.service';
import { AgencyService } from '@services/agency.service';
import { Agency } from '@shared/types/agency.interface';
import Croppie from 'croppie';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { Subject, map, of, switchMap, takeUntil } from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import { EUploadAgencyStep } from '@/app/dashboard/modules/agency-settings/utils/enum';
enum ESliderType {
  MINUS = 'MINUS',
  PLUS = 'PLUS'
}

@Component({
  selector: 'app-agency-logo-popup',
  templateUrl: './agency-logo-popup.component.html',
  styleUrls: ['./agency-logo-popup.component.scss']
})
export class AgencyLogoPopupComponent implements OnInit, OnChanges {
  @ViewChild('agencyLogo') agencyLogoElm: ElementRef;
  @Output() showUploadModalChange = new EventEmitter<boolean>();
  @Output() currentStepChange = new EventEmitter<number>();
  @Output() showQuitConfirmChange = new EventEmitter<boolean>();
  @Output() showCroppieChange = new EventEmitter<boolean>();
  @Output() linkNewImage = new EventEmitter<string>();
  @Output() saveChange = new EventEmitter();
  @Input() currentCompany: ICompany;
  @Input() currentStep: number;
  @Input() imageUrl: string;
  myCroppie: any;
  imageChangedEvent: any;
  uploadError = false;
  errorMsg: string;
  readonly sliderType = ESliderType;
  readonly UploadAgencyStep = EUploadAgencyStep;
  readonly acceptImageType = listAgencyLogoTypeDot;

  constructor(
    private readonly sharedService: SharedService,
    private loadingService: LoadingService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboardService,
    private companyService: CompanyService,
    private dashboardApiService: DashboardApiService,
    private userService: UserService
  ) {}
  private subcribe = new Subject<void>();
  ngOnInit() {}
  ngOnDestroy(): void {
    this.subcribe.next();
    this.subcribe.complete();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['currentStep'] &&
      changes['currentStep']?.currentValue === EUploadAgencyStep.UPLOAD
    ) {
      this.getCurrentCompanyLogo();
    }
  }

  setCurrentStep(step: number) {
    this.currentStepChange.emit(step);
  }

  async getBase64ImageFromUrl(imageUrl: string) {
    try {
      const res = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
      const blob = await res.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener(
          'load',
          function () {
            resolve(reader.result);
          },
          false
        );

        reader.onerror = () => {
          return reject(this);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return console.error(error);
    }
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        function () {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(file);
    });
  }

  fileChangeEvent(event): void {
    if (event.target.files.length) {
      const fileExtension = event.target.files[0].name
        .split('.')
        .pop()
        .toLowerCase();

      if (!listAgencyLogoTypeDot.includes('.' + fileExtension)) {
        event.target.value = '';
        this.errorMsg = UploadErrorMsg.UNSUPPORTED_EXTENSION;
        this.uploadError = true;
        this.currentStepChange.emit(EUploadAgencyStep.VIEW);
        return;
      }
      if (event.target.files[0].size > 25 * 1024 * 1024) {
        event.target.value = '';
        this.errorMsg = UploadErrorMsg.EXCEED_MAX_SIZE;
        this.uploadError = true;
        this.currentStepChange.emit(EUploadAgencyStep.VIEW);
        return;
      }
      this.imageChangedEvent = event;
      this.readFile(event.target.files[0]).then((result) => {
        this.getCroppie(result);
        const cropperContainerElm =
          document.getElementsByClassName('croppie-container');
        cropperContainerElm[0]?.replaceWith(cropperContainerElm[1]);
        this.listenChangeZoomValue();
        const slider = document.getElementsByClassName(
          'cr-slider'
        )[0] as HTMLInputElement;
        const minValue = Number(slider.getAttribute('min'));
        slider.setAttribute('min', String(minValue - 0.01));
      });
    }
  }

  handleZoomInOut(type: ESliderType) {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    let currentValue = Number(slider.getAttribute('aria-valuenow'));
    if (type === ESliderType.MINUS) {
      currentValue -= 0.01;
    } else {
      currentValue += 0.01;
    }
    slider.value = String(currentValue);
    slider.dispatchEvent(new Event('input'));
  }

  getCroppie(imgPath: any) {
    if (!this.agencyLogoElm) return;
    this.agencyLogoElm.nativeElement.setAttribute('src', imgPath);
    this.myCroppie = new Croppie(this.agencyLogoElm.nativeElement, {
      boundary: { width: 310, height: 260 },
      viewport: {
        width: 180,
        height: 180,
        type: 'square'
      },
      mouseWheelZoom: false
    });
  }

  getFilledPercentZoom() {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    if (slider) {
      const maxValue = Number(slider.getAttribute('max'));
      const minValue = Number(slider.getAttribute('min'));
      const percent =
        ((slider.valueAsNumber - minValue) / (maxValue - minValue)) * 100;
      slider.setAttribute('style', `--red: ${percent}%`);
    }
  }

  listenChangeZoomValue() {
    document
      .getElementsByClassName('cr-slider')[0]
      ?.addEventListener('input', () => {
        this.getFilledPercentZoom();
      });
    document
      .getElementsByClassName('cr-slider')[0]
      ?.addEventListener('change', () => {
        this.getFilledPercentZoom();
      });
  }

  getCurrentCompanyLogo() {
    this.companyService
      .getCurrentCompanyId()
      .pipe(
        takeUntil(this.subcribe),
        switchMap((id) => {
          if (id) {
            return this.companyService
              .getCompanies()
              .pipe(
                map((companies) =>
                  companies.find((company) => company.id === id)
                )
              );
          } else {
            return of(null);
          }
        })
      )
      .subscribe((filterCompanyData) => {
        if (filterCompanyData) {
          this.getBase64ImageFromUrl(
            filterCompanyData?.useDefaultLogo
              ? filterCompanyData?.defaultLogo
              : filterCompanyData?.logo
          ).then((result) => {
            this.getCroppie(this.imageUrl);
            this.listenChangeZoomValue();
          });
        }
      });
  }

  handleCloseModal() {
    if (this.currentStep === EUploadAgencyStep.UPLOAD) {
      this.showQuitConfirmChange.emit(true);
      this.showCroppieChange.emit(false);
      return;
    }
    if (this.currentStep === EUploadAgencyStep.REMOVE) {
      this.showUploadModalChange.emit(false);
      this.showQuitConfirmChange.emit(true);
      return;
    }
    this.showUploadModalChange.emit(false);
    this.resetValue();
  }

  async handleUploadPicture() {
    this.myCroppie.result({ type: 'base64', circle: false }).then((data) => {
      const formData = new FormData();
      const { useDefaultLogo, defaultLogo, logo } = this.currentCompany || {};
      const urlImageOld = useDefaultLogo ? defaultLogo : logo;
      const fileNameImageOld = urlImageOld?.split('/').pop();
      const fileTypeImageOld = urlImageOld?.split('.').pop();
      formData.append(
        'fileType',
        this.sharedService.getFileType(
          this.imageChangedEvent?.target?.files[0]?.type
            ? this.imageChangedEvent?.target?.files[0]?.type
            : fileTypeImageOld
        )
      );
      formData.append(
        'fileName',
        this.imageChangedEvent?.target?.files[0]?.name
          ? this.imageChangedEvent?.target?.files[0]?.name
          : fileNameImageOld
      );
      formData.append('base64', data);

      this.agencyService
        .updateLogo(formData)
        .pipe(takeUntil(this.subcribe))
        .subscribe({
          next: (res) => {
            this.linkNewImage.emit(res?.mediaLink);
            this.showUploadModalChange.emit(false);
            this.resetValue();
            this.saveChange.emit();
          },
          error: () => {
            this.showUploadModalChange.emit(false);
            this.resetValue();
            this.saveChange.emit();
          }
        });
    });
  }
  handleAgenciesData() {
    this.userService
      .getSelectedUser()
      .pipe(
        takeUntil(this.subcribe),
        switchMap((res) => {
          if (res) {
            return this.dashboardApiService.getUserAgencies(res.id);
          } else {
            return null;
          }
        })
      )
      .subscribe((res: Agency[]) => {
        this.companyService.setCompanies(res);
      });
  }
  removeLogo() {
    this.linkNewImage.emit(this.currentCompany.defaultLogo);
    this.showUploadModalChange.emit(false);
    this.handleAgenciesData();
    this.showUploadModalChange.emit(false);
    this.resetValue();
    this.saveChange.emit();
  }

  onCancel(step: number) {
    this.setCurrentStep(step);
    this.showCroppieChange.emit(true);
    this.uploadError = false;
  }

  resetValue() {
    this.getCurrentCompanyLogo();
    this.showCroppieChange.emit(true);
    this.currentStepChange.emit(EUploadAgencyStep.VIEW);
    this.uploadError = false;
  }
}

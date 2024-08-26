import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { properties, users } from 'src/environments/environment';
import { LocalStorageService } from '@services/local.storage';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { OverlayService } from '@services/overlay.service';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { PropertiesService } from '@services/properties.service';
import dayjs from 'dayjs';
import { IUserProperty } from '@shared/types/user-property.interface';
import { LoadingService } from '@services/loading.service';
import { ERmCrmStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { FilesService } from '@services/files.service';
import { SharedService } from '@services/shared.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'app-show-person',
  templateUrl: './show-person.component.html',
  styleUrls: ['./show-person.component.scss']
})
export class ShowPersonComponent implements OnInit, OnDestroy {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() exportHistory = new EventEmitter<string>();
  @Output() isShowConfirmSendVerifiedEmailModal = new EventEmitter<{
    status: boolean;
    email: string;
    userId: string;
  }>();
  private subscribers = new Subject<void>();
  public userId: any;
  public selectedProperty: any = null;
  public userDetail: any = [];
  public agencyLogo: any;
  public isDisableButton: boolean;
  private index: any;
  private id: any;
  public selectedUser: any;
  public userPropertiesId: string;
  public properties: IUserProperty[] = [];
  public fileProperties = [];
  public initials = '';
  public navigationPropertyId: string;
  private selectedPropId: string;
  private selectedUserId: string;
  public arrMobileNumber: any[] = [];
  public currentAgencyId: string;
  eUserPropertyType = EUserPropertyType;
  DATE_FORMAT_DAYJS =
    this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS;
  public isRmEnvironment: boolean = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private localStorageService: LocalStorageService,
    private route: ActivatedRoute,
    private overlayService: OverlayService,
    private agencyService: AgencyService,
    private panelService: ControlPanelService,
    private propertyService: PropertiesService,
    public loadingService: LoadingService,
    private filesService: FilesService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(res);
        }
      });

    this.panelService
      .getSelectedID()
      .pipe(takeUntil(this.subscribers))
      .subscribe((selectedId) => {
        if (selectedId) {
          this.selectedUserId = selectedId;
        }
      });

    this.filesService.listofActiveFiles
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.fileProperties = [...res];
          this.fileProperties.sort(({ createdAt: a }, { createdAt: b }) => {
            return new Date(b).getTime() - new Date(a).getTime();
          });
          this.sharedService.mapFileTypeDot(this.fileProperties);
        }
      });

    this.propertyService
      .getSelectedID()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res || this.isRmEnvironment) {
          this.loadingService.onMultiLoading();
          this.selectedPropId = res;
          this.apiService
            .postAPI(properties, 'v1/person', {
              userId: this.selectedUserId,
              propertyId: res ?? ''
            })
            .pipe(takeUntil(this.subscribers))
            .subscribe({
              next: (result) => {
                if (result) {
                  if (result.length > 1) {
                    result = result.slice(0, 1);
                  }
                  this.userDetail = result;
                  this.userPropertiesId = this.userDetail[0]?.userPropertyId;
                  this.arrMobileNumber = this.userDetail.flatMap((item) =>
                    JSON.parse(item.mobileNumber || '[]')
                  );
                  this.userDetail[0].firstActive = this.userDetail[0]
                    ?.firstActive
                    ? 'Joined ' +
                      dayjs(this.userDetail[0]?.firstActive).format(
                        this.agencyDateFormatService.dateFormat$.value
                          .DATE_FORMAT_DAYJS
                      )
                    : '- -/- -/- -';

                  if (this.userDetail[0]?.firstName) {
                    this.initials =
                      this.userDetail[0]?.firstName.charAt(0) +
                      this.userDetail[0]?.lastName.charAt(0);
                  } else {
                    this.initials =
                      this.userDetail[0]?.lastName.charAt(0) ?? '';
                  }
                }
              },
              complete: () => {
                this.loadingService.offMultiLoading();
              }
            });

          this.loadingService.onMultiLoading();
          this.apiService
            .getAPI(properties, 'user-properties?userId=' + this.selectedUserId)
            .pipe(takeUntil(this.subscribers))
            .subscribe({
              next: (prop) => {
                this.properties = prop.filter(
                  (el) => el.userPropertyStatus !== 'DELETED'
                );

                // Map once at the end
                this.properties.forEach((el) => {
                  el.mobileNumber = JSON.parse(el.mobileNumber || '[]');
                  el.type = this.mapTypeUserProperty(el.type);
                  el.userPropertyStatus = this.mapUserPropertyStatus(
                    el.userPropertyStatus
                  );
                  if (el.vacatedAt) {
                    el.vacatedAt = dayjs(el.vacatedAt).format(
                      this.agencyDateFormatService.dateFormat$.value
                        .DATE_FORMAT_DAYJS
                    );
                  }
                });
                const sortUserProfileFn = (
                  a: IUserProperty,
                  b: IUserProperty
                ) => {
                  if (
                    a.userId == this.selectedUserId &&
                    a.id == this.selectedPropId
                  ) {
                    return -1;
                  } else {
                    return 0;
                  }
                };
                this.properties.sort(sortUserProfileFn);
                this.selectedProperty = this.properties[0];

                if (this.properties?.length) {
                  this.loadingService.onMultiLoading();
                  this.filesService
                    .updateFileList(
                      this.properties[0]?.id,
                      this.properties[0].userId
                    )
                    .add(() => {
                      this.loadingService.offMultiLoading();
                    });
                }
              },
              complete: () => {
                this.loadingService.offMultiLoading();
              }
            });
        }
      });
  }

  private mapUserPropertyStatus(status: string): string {
    if (this.isRmEnvironment) {
      if (Object.values(ERmCrmStatus).some((item) => item === status)) {
        switch (status) {
          case ERmCrmStatus.RMCurrent:
            return 'CURRENT';
          case ERmCrmStatus.RMFuture:
            return 'FUTURE';
          case ERmCrmStatus.RMPast:
            return 'PAST';
          default:
            return '';
        }
      } else {
        return '';
      }
    } else {
      return status;
    }
  }

  private mapTypeUserProperty(type: string): string {
    switch (type) {
      case EUserPropertyType.TENANT_UNIT:
        return 'TENANT (UNIT)';
      case EUserPropertyType.TENANT_PROPERTY:
        return 'TENANT (PROPERTY)';
      default:
        return type;
    }
  }

  handleGetFileProperty(property) {
    this.filesService.updateFileList(property?.id, property?.userId);
    this.selectedProperty = property;
  }

  sendWelcomeEmail(propertyId) {
    this.isDisableButton = true;
    this.apiService
      .postAPI(users, 'send-welcome-email', {
        userId: this.userId,
        propertyId: propertyId
      })
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          const overlayData = {
            title: 'Success!',
            message: 'Welcome email sent',
            iconUrl: 'assets/images/tickmark.png'
          };
          this.overlayService
            .showResultOverlay(overlayData, 2000)
            .subscribe(() => {
              this.userDetail.iviteSent = true;
              this.isDisableButton = false;
            });
        },
        error: () => {}
      });
  }

  hide(property) {
    const body = {
      status: property.isActive ? 'INACTIVE' : 'ACTIVE',
      propertyId: property.propertyId
    };
    this.apiService
      .putAPI(properties, 'update-person-status/' + this.userDetail.id, body)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        this.id = '';
        this.index = '';
        this.localStorageService.setValue('tab', 'user');
      });
  }

  editPerson() {
    this.localStorageService.setValue('tab', 'user');
    this.router.navigate(['edit-person'], {
      queryParams: {
        userId: this.userId
      }
    });
  }

  back() {
    this.localStorageService.setValue('tab', 'user');
    this.router.navigate([`dashboard/messages/${this.navigationPropertyId}`]);
  }

  cancel() {
    this.localStorageService.setValue('tab', 'user');
    window.history.back();
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public isShowHistory(userPropertiesId: string) {
    if (userPropertiesId) {
      this.exportHistory.next(userPropertiesId);
    }
  }

  onShowHideVerifyPopup(status: boolean, email: string, userId: string) {
    this.isShowConfirmSendVerifiedEmailModal.emit({ status, email, userId });
  }
}

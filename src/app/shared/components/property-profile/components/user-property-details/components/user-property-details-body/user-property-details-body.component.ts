import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ETypePage } from '@/app/user/utils/user.enum';
import { combineLatest, Subject } from 'rxjs';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { takeUntil } from 'rxjs/operators';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { QuitConfirmOpenFrom } from '@shared/components/quit-confirm/quit-confirm.component';
import { EToastMessageDefault } from '@/app/toast/toastType';
import { UserService } from '@services/user.service';
import {
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '@services/popup.service';
import { SharedService } from '@services/shared.service';
import {
  EPreviewUserType,
  EPropertyProfileStep
} from '@shared/components/property-profile/enums/property-profile.enum';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { IUserTenancy } from '@shared/types/user.interface';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { ECRMId, EInviteStatus } from '@shared/enum';
import { mappedProfileRole } from '@/app/user/shared/components/drawer-user-info/constants/constants';

@Component({
  selector: 'user-property-details-body',
  templateUrl: './user-property-details-body.component.html',
  styleUrls: ['./user-property-details-body.component.scss']
})
export class UserPropertyDetailsBodyComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() isLoading = false;
  @Input() currentDataUser: UserProperty;
  @Input() userProperty: IUserPropertyV2;
  @Input() openFrom: ETypePage = ETypePage.TENANTS_LANLORDS;
  @Input() crmSystemId: string;
  public phoneNumberOnOption: SecondaryPhone;
  @Input() propertyId: string = '64abc598-d8a6-43d2-992e-2027ab91521c';
  @Input() userPropertyGroupId: string = '1e085cd7-6416-4e2a-b83e-1e50d6243128';
  visibleDeleteEmailConfirm: boolean = false;
  addEmailTitle = 'Add email';
  addEmailErr: string = '';
  isConsole: boolean = false;
  isArchiveMailbox: boolean = false;
  isDisconnectedMailbox: boolean = false;
  targetOpenForm: QuitConfirmOpenFrom;
  emailOnOption: SecondaryEmail;
  isShowAddEmail: boolean;
  isRM: boolean = false;
  currentStep: EPropertyProfileStep;
  userTenancyList?: IUserTenancy;
  protected readonly ETypePage = ETypePage;
  protected readonly EPropertyProfileStep = EPropertyProfileStep;
  protected readonly EInviteStatus = EInviteStatus;
  mobilePhones: string[] = [];
  private _destroy$ = new Subject<void>();

  constructor(
    private _cdr: ChangeDetectorRef,
    private _toastService: ToastrService,
    private _inboxService: InboxService,
    private _popupService: PopupService,
    private _sharedService: SharedService,
    private _userService: UserService,
    private _propertyProfileService: PropertyProfileService,
    private _userAgentApiService: UserAgentApiService
  ) {}

  get isTaskDetail() {
    return this.openFrom === ETypePage.TASK_DETAIL;
  }

  ngOnInit(): void {
    this.isConsole = this._sharedService.isConsoleUsers();
    combineLatest([
      this._inboxService.isArchiveMailbox$,
      this._inboxService.getIsDisconnectedMailbox()
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isArchiveMailbox = isArchiveMailbox;
        this.isDisconnectedMailbox = isDisconnectedMailbox;
      });

    combineLatest([
      this._propertyProfileService.currentCompany$,
      this._propertyProfileService.currentStep$
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([company, step]) => {
        this.crmSystemId = company?.CRM;
        this.isRM = company?.CRM === ECRMId.RENT_MANAGER;
        this.currentStep = step;

        if (
          this.isRM &&
          this.currentStep === EPropertyProfileStep.TENANT_DETAIL
        ) {
          this._userAgentApiService
            .getListTenantByTenancy(
              this._propertyProfileService.getCurrentTenant().propertyId,
              this._propertyProfileService.getCurrentTenant()
                .userPropertyGroupId
            )
            .pipe(takeUntil(this._destroy$))
            .subscribe({
              next: (userTenancyList) => {
                this.userTenancyList = userTenancyList;
                this._cdr.markForCheck();
              }
            });
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  onTargetOpenForm(event: QuitConfirmOpenFrom) {
    this.targetOpenForm = event;
  }

  showQuitConfirm() {
    this.visibleDeleteEmailConfirm = false;
  }

  onDeleteEmail(secondaryEmail: SecondaryEmail) {
    this.emailOnOption = secondaryEmail;
    this._popupService.fromDeleteEmail.next(secondaryEmail.email);
    this.visibleDeleteEmailConfirm = true;
  }

  onDeletePhoneNumber(secondaryPhoneNumber: SecondaryPhone) {
    this.phoneNumberOnOption = secondaryPhoneNumber;
    this._popupService.fromDeletePhone.next(secondaryPhoneNumber.phoneNumber);
    this.visibleDeleteEmailConfirm = true;
  }

  onDeleteConfirm(event: boolean) {
    if (!event) return;
    switch (this.targetOpenForm) {
      case QuitConfirmOpenFrom.deletePhone:
        this._deleteSecondaryPhone();
        break;
      case QuitConfirmOpenFrom.deleteEmail:
        this._deleteSecondaryEmail();
        break;
    }
  }

  onAddEmail() {
    this.isShowAddEmail = true;
  }

  handleCloseModal() {
    this.isShowAddEmail = false;
  }

  onAddEmailConfirm(email: string) {
    if (!email) return;
    this.addEmailErr = '';
    this._userService
      .addSecondaryEmailToContact(
        this.userProperty.user.id,
        email,
        this.userProperty.propertyId
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this.userProperty.user = {
            ...this.userProperty.user,
            secondaryEmails: [
              ...this.userProperty.user.secondaryEmails,
              {
                id: res.id,
                email: res.email,
                propertyId: this.userProperty.propertyId
              }
            ]
          };
          this._cdr.markForCheck();
          this._userService.isAddEmail$.next(res);
          this.isShowAddEmail = false;
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
          this._cdr.markForCheck();
        }
      });
  }

  get isUnitOwner() {
    return (
      this.isRM &&
      this.userProperty?.type === EPreviewUserType.LANDLORD &&
      this.userProperty?.property?.sourceProperty?.type === 'Unit'
    );
  }

  handleClickAddress() {
    if (this.isUnitOwner) {
      this._propertyProfileService.setDataOfProperty({
        ...this._propertyProfileService.getDataOfProperty(),
        filterOfTenancies: false,
        filterOfOwners: false
      });
      this._propertyProfileService.navigateToStep(
        EPropertyProfileStep.PARENT_PROPERTY_DETAIL,
        this.userProperty?.property.sourceProperty.parentPropertyId
      );
      return;
    }

    this._propertyProfileService.navigateToStep(
      EPropertyProfileStep.PROPERTY_DETAIL
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.currentDataUser) {
      this.currentDataUser = {
        ...this.currentDataUser,
        role:
          mappedProfileRole[this.currentDataUser?.companyAgents?.role] || null,
        secondaryEmails: (Array.isArray(this.currentDataUser.secondaryEmails)
          ? this.currentDataUser.secondaryEmails
          : this.currentDataUser.secondaryEmails
          ? [this.currentDataUser.secondaryEmails] || []
          : []
        ).sort(
          (a, b) =>
            new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
        ),
        secondaryPhones: Array.isArray(this.currentDataUser.secondaryPhones)
          ? this.currentDataUser.secondaryPhones
          : this.currentDataUser.secondaryPhones
          ? [this.currentDataUser.secondaryPhones] || []
          : [],
        mobileNumber: (Array.isArray(this.currentDataUser?.mobileNumber)
          ? this.currentDataUser?.mobileNumber
          : []
        )?.filter((p) => p !== this.currentDataUser?.phoneNumber)
      };
    }

    if (changes['userProperty'].currentValue) {
      const mobiles = this.userProperty?.user?.mobileNumber;
      if (Array.isArray(mobiles)) {
        this.mobilePhones = mobiles.filter(
          (m) => m !== this.userProperty?.user?.phoneNumber
        );
      } else {
        try {
          this.mobilePhones = JSON.parse(mobiles).filter(
            (m: string) => m !== this.userProperty?.user?.phoneNumber
          );
        } catch (error) {
          console.error('An error occurred:', error);
        }
      }
    }
  }

  private _deleteSecondaryPhone() {
    this._userService
      .deleteSecondaryPhone(this.phoneNumberOnOption.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentDataUser = {
          ...this.currentDataUser,
          secondaryPhones:
            this.currentDataUser.secondaryPhones.filter(
              (phone) => phone.id !== this.phoneNumberOnOption.id
            ) || []
        };
        if (this.openFrom === ETypePage.TASK_DETAIL) {
          this._toastService.success(EToastMessageDefault.deletedSuccess);
        }
        this._cdr.markForCheck();
        this._userService.setIsDeletePhoneNumber(true);
      });
  }

  private _deleteSecondaryEmail() {
    this._userService
      .deleteSecondaryEmail(this.emailOnOption.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.userProperty.user = {
          ...this.userProperty.user,
          secondaryEmails:
            this.userProperty.user.secondaryEmails.filter(
              (email) => email.id !== this.emailOnOption.id
            ) || []
        };
        if (this.openFrom === ETypePage.TASK_DETAIL) {
          this._toastService.success(EToastMessageDefault.deletedSuccess);
        }
        this._cdr.markForCheck();
        this._userService.isDeletedEmail$.next(this.emailOnOption.id);
      });
  }

  protected readonly EPreviewUserType = EPreviewUserType;
}

import { PopupService } from '@services/popup.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { UserService } from '@services/user.service';
import {
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ETypePage } from '@/app/user/utils/user.enum';
import { QuitConfirmOpenFrom } from '@shared/components/quit-confirm/quit-confirm.component';
import { ToastrService } from 'ngx-toastr';
import { EToastMessageDefault } from '@/app/toast/toastType';
import { EInviteStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { mappedProfileRole } from '@/app/user/shared/components/drawer-user-info/constants/constants';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { EConversationType, ECreatedFrom } from '@/app/shared';

@Component({
  selector: 'card-user-info',
  templateUrl: './card-user-info.component.html',
  styleUrls: ['./card-user-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardUserInfoComponent implements OnInit, OnChanges {
  @Input() currentDataUser: UserProperty;
  @Input() openFrom: ETypePage;
  @Input() selectUserProperty: IUserPropertyV2;
  @Input() isNotDetectedContact = false;

  public isShowQuitConfirm: boolean = false;
  public isShowAddEmail: boolean = false;
  public emailOnOption: SecondaryEmail;
  public subscribers = new Subject<void>();
  public addEmailTitle = 'Add email';
  public addEmailErr: string = '';
  public ETypePage = ETypePage;
  public phoneNumberOnOption: SecondaryPhone;
  public targetOpenForm: QuitConfirmOpenFrom;
  public isExistSecondaryPhones: boolean = false;
  public isExistSecondaryEmails: boolean = false;
  public readonly EUserPropertyType = EUserPropertyType;
  public isConsole: boolean = false;
  public isArchiveMailbox: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public readonly EInviteStatus = EInviteStatus;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  private destroy$ = new Subject();
  public ECreatedFrom = ECreatedFrom;

  constructor(
    private popupService: PopupService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private toastService: ToastrService,
    private readonly inboxService: InboxService,
    private readonly sharedService: SharedService,
    private readonly userInfoDrawerService: UserInfoDrawerService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isArchiveMailbox = isArchiveMailbox;
        this.isDisconnectedMailbox = isDisconnectedMailbox;
      });
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
        mobileNumber: (Array.isArray(this.currentDataUser?.mobileNumber) &&
        this.currentDataUser.conversationType !== EConversationType.SMS
          ? this.currentDataUser?.mobileNumber
          : []
        )?.filter((p) => p !== this.currentDataUser?.phoneNumber)
      };
      this.isExistSecondaryPhones = this.currentDataUser.secondaryPhones.some(
        (phone) => phone.id
      );
      this.isExistSecondaryEmails = this.currentDataUser.secondaryEmails.some(
        (email) => email.id
      );
    }
  }

  onAddEmail(data) {
    this.isShowAddEmail = true;
  }

  onAddEmailConfirm(event) {
    if (!event) return;
    this.addEmailErr = '';
    const userId =
      this.openFrom === ETypePage.TENANTS_PROSPECT
        ? this.currentDataUser.userId
        : this.currentDataUser.id;
    this.userService
      .addSecondaryEmailToContact(
        userId,
        event,
        this.currentDataUser.propertyId
      )
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          this.currentDataUser = {
            ...this.currentDataUser,
            secondaryEmails: [
              ...this.currentDataUser.secondaryEmails,
              {
                id: res.id,
                email: res.email,
                createdAt: res.createdAt
              }
            ].sort(
              (a, b) =>
                new Date(b?.createdAt).getTime() -
                new Date(a?.createdAt).getTime()
            )
          };

          this.cdr.markForCheck();
          this.userService.isAddEmail$.next(res);
          this.isShowAddEmail = false;
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
          this.cdr.markForCheck();
        }
      });
  }

  onDeleteEmail(secondaryEmail) {
    if (this.isNotDetectedContact) return;
    this.emailOnOption = secondaryEmail;
    this.popupService.fromDeleteEmail.next(secondaryEmail.email);
    this.isShowQuitConfirm = true;
  }
  onDeletePhoneNumber(secondaryPhoneNumber) {
    if (this.isNotDetectedContact) return;
    this.phoneNumberOnOption = secondaryPhoneNumber;
    this.popupService.fromDeletePhone.next(secondaryPhoneNumber.phoneNumber);
    this.isShowQuitConfirm = true;
  }

  showQuitConfirm() {
    this.isShowQuitConfirm = false;
  }

  deleteSecondaryPhone() {
    this.userService
      .deleteSecondaryPhone(this.phoneNumberOnOption.id)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.currentDataUser = {
          ...this.currentDataUser,
          secondaryPhones:
            this.currentDataUser.secondaryPhones.filter(
              (phone) => phone.id !== this.phoneNumberOnOption.id
            ) || []
        };
        this.isExistSecondaryPhones = this.currentDataUser.secondaryPhones.some(
          (phone) => phone.id
        );
        if (this.openFrom === ETypePage.TASK_DETAIL) {
          this.toastService.success(EToastMessageDefault.deletedSuccess);
        }
        this.cdr.markForCheck();
        this.userService.setIsDeletePhoneNumber(true);

        if (
          [EConversationType.SMS, EConversationType.WHATSAPP].includes(
            this.currentDataUser.conversationType
          )
        ) {
          this.userInfoDrawerService.setDeletedUserForSMS(this.currentDataUser);
        } else {
          if (
            this.selectUserProperty.fromPhoneNumber ===
            this.phoneNumberOnOption.phoneNumber
          ) {
            this.userInfoDrawerService.setDeletedUser(
              this.currentDataUser.id || this.currentDataUser.userId
            );
          }
        }
      });
  }

  deleteSecondaryEmail() {
    this.userService
      .deleteSecondaryEmail(this.emailOnOption.id)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.currentDataUser = {
          ...this.currentDataUser,
          secondaryEmails:
            this.currentDataUser.secondaryEmails.filter(
              (email) => email.id !== this.emailOnOption.id
            ) || []
        };
        this.isExistSecondaryEmails = this.currentDataUser.secondaryEmails.some(
          (email) => email.id
        );
        if (this.openFrom === ETypePage.TASK_DETAIL) {
          this.toastService.success(EToastMessageDefault.deletedSuccess);
        }
        this.cdr.markForCheck();
        this.userService.isDeletedEmail$.next(this.emailOnOption.id);
        if (
          [EConversationType.SMS, EConversationType.WHATSAPP].includes(
            this.currentDataUser.conversationType
          )
        ) {
          this.userInfoDrawerService.setDeletedUserForSMS(this.currentDataUser);
        } else {
          if (this.selectUserProperty?.email === this.emailOnOption?.email) {
            this.userInfoDrawerService.setDeletedUser(
              this.currentDataUser.id || this.currentDataUser.userId
            );
          }
        }
      });
  }
  onDeleteConfirm(event: boolean) {
    if (!event) return;
    switch (this.targetOpenForm) {
      case QuitConfirmOpenFrom.deletePhone:
        this.deleteSecondaryPhone();
        break;
      case QuitConfirmOpenFrom.deleteEmail:
        this.deleteSecondaryEmail();
        break;
    }
  }

  handleCloseModal() {
    this.isShowAddEmail = false;
  }

  onTargetOpenForm(event) {
    this.targetOpenForm = event;
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
  }
}

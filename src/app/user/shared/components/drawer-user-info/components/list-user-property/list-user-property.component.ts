import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { OtherContactService } from '@services/orther-contact.service';
import { UserService } from '@services/user.service';
import { EConfirmContactType } from '@shared/enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ETypePage } from '@/app/user/utils/user.enum';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';

@Component({
  selector: 'list-user-property',
  templateUrl: 'list-user-property.component.html',
  styleUrls: ['list-user-property.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListUserPropertyComponent implements OnInit, OnDestroy, OnChanges {
  @Input() currentDataUser: UserProperty;
  @Input() userProperty: IUserPropertyV2;
  @Input() openFrom: ETypePage;
  @Input() isDisableActionByOffBoardStatus: boolean;

  public isEnable: boolean;
  public userPropertyHover: string;
  public conversationExportHover: string;
  public deleteState: string;
  public showPopupDelete = false;
  private destroyed = new Subject<void>();

  public readonly eTypePage = ETypePage;
  public readonly EConfirmContactType = EConfirmContactType;
  public readonly ETypePage = ETypePage;
  public isRmSystem: boolean;
  public isTenantOwner: boolean;

  constructor(
    private userService: UserService,
    private mainService: OtherContactService,
    private companyService: CompanyService,
    private agencyService: AgencyService,
    private userInfoDrawerService: UserInfoDrawerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDataUser']?.currentValue) {
      this.deleteState = this.getIconState(this.currentDataUser);
      this.userPropertyHover = this.getTooltipTitle(
        this.userProperty,
        this.currentDataUser
      );
    }
  }

  ngOnInit() {
    this.companyService.getCurrentCompany().subscribe((company) => {
      this.isRmSystem = this.agencyService.isRentManagerCRM(company);
    });
    this.conversationExportHover = this.getTooltipExport(this.userProperty);
    this.isTenantOwner = !!this.conversationExportHover;
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  getTooltipTitle(userProperty, currentDataUser) {
    const types = [
      EConfirmContactType.LANDLORD,
      EConfirmContactType.TENANT,
      EConfirmContactType.TENANT_PROPERTY
    ];
    let systemName = this.isRmSystem ? 'Rent Manager' : 'Property Tree';
    if (types.includes(userProperty?.type)) {
      return userProperty?.isPrimary
        ? 'Cannot delete primary contact'
        : `This contact can only be deleted directly from ${systemName}`;
    } else if (
      currentDataUser?.type === EConfirmContactType.SUPPLIER ||
      currentDataUser?.type === EConfirmContactType.OTHER
    ) {
      return currentDataUser.isSystemCreate
        ? ''
        : `This contact can only be deleted directly from ${systemName}`;
    }
    return `This contact can only be deleted directly from ${systemName}`;
  }

  getIconState(currentDataUser) {
    const types = [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER];
    if (
      currentDataUser?.isSystemCreate &&
      types.includes(currentDataUser?.type)
    ) {
      return 'deleted';
    } else {
      return 'deletedDisable';
    }
  }

  handleCloseModalDelete() {
    this.showPopupDelete = false;
  }

  handleDeleteItems() {
    this.deleteUserProperty(this.currentDataUser);
    this.showPopupDelete = false;
  }

  showDeleteConfirmation(currentDataUser) {
    const types = [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER];

    this.showPopupDelete =
      currentDataUser?.isSystemCreate && types.includes(currentDataUser?.type);
  }

  deleteUserProperty(currentDataUser) {
    if (!currentDataUser) return;
    switch (this.currentDataUser?.type) {
      case EConfirmContactType.SUPPLIER:
        this.handleDeleteSupplier(currentDataUser);
        break;
      case EConfirmContactType.OTHER:
        this.handleDeleteOther(currentDataUser);
        break;
    }
  }

  handleDeleteSupplier(currentDataUser) {
    const currentUserId = this.userService.userInfo$.value.id;
    this.userService
      .deleteSupplier({
        supplierDeleteIds: [currentDataUser.id],
        userId: currentUserId
      })
      .pipe(
        finalize(() => {
          this.showPopupDelete = false;
        }),
        takeUntil(this.destroyed)
      )
      .subscribe(() => {
        this.userService.setIsDeleteUser(true);
      });
  }

  handleDeleteOther(currentDataUser) {
    const currentUserId = this.userService.userInfo$.value.id;
    this.mainService
      .delete({
        otherContactDeleteIds: [currentDataUser.id],
        userId: currentUserId
      })
      .pipe(
        finalize(() => {
          this.showPopupDelete = false;
        }),
        takeUntil(this.destroyed)
      )
      .subscribe(() => {
        this.userService.setIsDeleteUser(true);
      });
  }

  showModalExport() {
    const userPropertyId =
      this.userProperty?.id || this.currentDataUser?.userPropertyId;

    this.userInfoDrawerService.openExportConversation({
      state: true,
      userPropertyId
    });
  }

  getTooltipExport(userProperty) {
    const types = [
      EConfirmContactType.LANDLORD,
      EConfirmContactType.TENANT,
      EConfirmContactType.TENANT_PROPERTY
    ];

    return types.includes(userProperty?.type)
      ? 'Export conversation history as PDF'
      : '';
  }
}

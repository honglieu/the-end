import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EConfirmContactType } from '@shared/enum';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { finalize, Subject } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { takeUntil } from 'rxjs/operators';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { User } from '@shared/types/user.interface';
import { OtherContactService } from '@services/orther-contact.service';
import { ECrmType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'user-property-details-footer',
  templateUrl: './user-property-details-footer.component.html',
  styleUrls: ['./user-property-details-footer.component.scss']
})
export class UserPropertyDetailsFooterComponent implements OnInit, OnDestroy {
  deleteTooltipTitle: string;
  exportConversationTooltipTitle: string = '';
  @Input() userProperty!: IUserPropertyV2;
  visibleExportConversationModal: boolean = false;
  disableExportButton: boolean = false;
  showPopupDelete: boolean = false;
  protected EConfirmContactType = EConfirmContactType;
  private _destroy$ = new Subject();
  private isRmSystem: boolean;

  constructor(
    private _conversationService: ConversationService,
    private _companyService: CompanyService,
    private _agencyService: AgencyService,
    private _mainService: OtherContactService,
    private _userService: UserService
  ) {}

  get deleteIcon(): string {
    const types = [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER];
    if (
      this.userProperty.user?.isSystemCreate &&
      types.includes(this.userProperty.user?.type as EConfirmContactType)
    ) {
      return 'deleted';
    } else {
      return 'deletedDisable';
    }
  }

  showModalExport() {
    this.visibleExportConversationModal = true;
  }

  showDeleteConfirmation() {
    const types = [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER];

    this.showPopupDelete =
      this.userProperty.user?.isSystemCreate &&
      types.includes(this.userProperty.user?.type as EConfirmContactType);
  }

  exportConversationHistory() {
    this.disableExportButton = true;
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    this._conversationService
      .exportHistoryConversation(this.userProperty.id, clientTimeZone)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this.disableExportButton = false;
          this.closeExportModal();
        },
        error: () => {
          this.disableExportButton = false;
          this.closeExportModal();
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next(true);
    this._destroy$.complete();
  }

  closeExportModal() {
    this.visibleExportConversationModal = false;
  }

  ngOnInit(): void {
    this._companyService.getCurrentCompany().subscribe((company) => {
      this.isRmSystem = this._agencyService.isRentManagerCRM(company);
    });
    this.exportConversationTooltipTitle = this._getTooltipExport(
      this.userProperty
    );
    this.deleteTooltipTitle = this._getTooltipTitle(this.userProperty);
  }

  handleCloseModalDelete() {
    this.showPopupDelete = false;
  }

  deleteUserProperty(currentDataUser: User) {
    if (!currentDataUser) return;
    switch (this.userProperty.user?.type) {
      case EConfirmContactType.SUPPLIER:
        this._handleDeleteSupplier(currentDataUser);
        break;
      case EConfirmContactType.OTHER:
        this._handleDeleteOther(currentDataUser);
        break;
    }
  }

  handleDeleteItems() {
    this.deleteUserProperty(this.userProperty.user);
    this.showPopupDelete = false;
  }

  private _handleDeleteOther(currentDataUser: User) {
    const currentUserId = this._userService.userInfo$.value.id;
    this._mainService
      .delete({
        otherContactDeleteIds: [currentDataUser.id],
        userId: currentUserId
      })
      .pipe(
        finalize(() => {
          this.showPopupDelete = false;
        }),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this._userService.setIsDeleteUser(true);
      });
  }

  private _handleDeleteSupplier(currentDataUser: User) {
    const currentUserId = this._userService.userInfo$.value.id;
    this._userService
      .deleteSupplier({
        supplierDeleteIds: [currentDataUser.id],
        userId: currentUserId
      })
      .pipe(
        finalize(() => {
          this.showPopupDelete = false;
        }),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this._userService.setIsDeleteUser(true);
      });
  }

  private _getTooltipExport(userProperty: IUserPropertyV2) {
    const types = [
      EConfirmContactType.LANDLORD,
      EConfirmContactType.TENANT,
      EConfirmContactType.TENANT_PROPERTY
    ];

    return types.includes(userProperty?.type as EConfirmContactType)
      ? 'Export conversation history as PDF'
      : '';
  }

  private _getTooltipTitle(userProperty: IUserPropertyV2) {
    const types = [
      EConfirmContactType.LANDLORD,
      EConfirmContactType.TENANT,
      EConfirmContactType.TENANT_PROPERTY
    ];
    let systemName = this.isRmSystem
      ? ECrmType.RENT_MANAGER
      : ECrmType.PROPERTY_TREE;
    if (types.includes(userProperty?.type as EConfirmContactType)) {
      return userProperty?.isPrimary
        ? 'Cannot delete primary contact'
        : `This contact can only be deleted directly from ${systemName}`;
    } else if (
      userProperty.user?.type === EConfirmContactType.SUPPLIER ||
      userProperty.user?.type === EConfirmContactType.OTHER
    ) {
      return userProperty.user?.isSystemCreate
        ? ''
        : `This contact can only be deleted directly from ${systemName}`;
    }
    return `This contact can only be deleted directly from ${systemName}`;
  }
}

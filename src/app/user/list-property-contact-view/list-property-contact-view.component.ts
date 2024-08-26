import { UserTypeInPTPipe } from '@shared/pipes/user-type-in-pt.pipe';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  EContactPageType,
  ETypeContactItem,
  IAgentUserProperties,
  IContactItemFormatted,
  ISourceProperty,
  IUserProperties,
  IUserPropertyGroup
} from './model/main';
import { ConversationService } from '@services/conversation.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { UserService } from '@services/user.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import {
  EActionUserType,
  ERentPropertyStatus,
  ETypePage
} from '@/app/user/utils/user.enum';
import { IPropertyInfo } from '@shared/types/user.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ToastrService } from 'ngx-toastr';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { TaskEditorListViewService } from './../../dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import {
  CheckedUser,
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { EMAIL_FORMAT_REGEX, NO_PROPERTY } from '@services/constants';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { SelectionModelPaging } from '@/app/user/utils/collections';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { SharedService } from '@services/shared.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { CompanyService } from '@services/company.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { Store } from '@ngrx/store';
import { tenantsOwnersPageActions as tenantsOwnersRMPageActions } from '@core/store/contact-page/tenants-owners/rent-manager/actions/tenants-owners-rm-page.actions';
import { tenantsOwnersPageActions as tenantsOwnersPTPageActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-page.actions';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';

@Component({
  selector: 'list-property-contact-view',
  templateUrl: './list-property-contact-view.component.html',
  styleUrls: ['./list-property-contact-view.component.scss']
})
@DestroyDecorator
export class ListPropertyContactViewComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @Input() typePage: ETypePage;
  @Output() handleRefreshList = new EventEmitter<{
    refreshed?: boolean;
    pageIndex?: number;
  }>();
  @Input() totalItems: number = 0;
  @Input() pageIndex: number = 0;
  @Input() totalPages: number = 0;
  @Input() agentListLength: number = 0;
  @Input() listAgentUserProperties: IContactItemFormatted<
    | IAgentUserProperties
    | ISourceProperty
    | IUserPropertyGroup
    | IUserProperties
  >[] = [];
  @Input() isLoading: Boolean;
  @Input() isLoadingMore: Boolean;
  @Input() increaseHeaderHeight: number = 0;
  public isScrolledToBottom: boolean;
  public allCurrentAgentValues: IAgentUserProperties[] = [];
  readonly ACTION_TYPE = EActionUserType;
  readonly ETypeContactItem = ETypeContactItem;
  public isBuilding: boolean = true;
  public selectedUser: UserProperty[] = [];
  public searchValue: string = '';
  public activeMobileApp: boolean = false;
  public isShowPropertyInfo = false;
  public isConsole: boolean = false;
  public popupState = {
    isShowUserInfo: false,
    isShowExportSuccess: false,
    isShowAddEmail: false,
    isShowDeleteUser: false,
    propertyInfo: false,
    addNotePropertyInfo: false,
    isSendInvite: false,
    isShowSendMessageModal: false,
    isShowSuccessMessageModal: false,
    visiblePropertyProfile: false
  };
  public createNewConversationConfigs = {
    'footer.buttons.nextTitle': 'Send',
    'header.showDropdown': true,
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK_EVENT,
    'body.prefillReceivers': false,
    'otherConfigs.isCreateMessageType': true,
    'otherConfigs.isFromContactPage': true,
    'body.prefillReceiversList': [],
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.CONTACT,
    'otherConfigs.isShowGreetingSendBulkContent': false,
    'inputs.openFrom': EUserPropertyType.LANDLORD,
    'inputs.typeMessage': ETypeMessage.SCRATCH,
    'header.title': 'Bulk send email',
    'header.icon': 'energy',
    'header.isPrefillProperty': false,
    'header.isChangeHeaderText': true,
    'header.viewRecipients': true
  };
  public textConfirm = {
    title: 'Delete this user',
    contentText:
      'This will delete their Trudi account and leave them unable to log into the tenant app.'
  };
  public addEmailTitle = 'Add email';
  public popupModalPosition = ModalPopupPosition;
  public eUserPropertyType = EUserPropertyType;
  public typeMessage = ETypeMessage;
  public userPropertiesSelected;
  environmentType: string;
  addEmailErr: string;
  selectedUserPropertiesId: string;
  public isExpandProperty: boolean = true;
  public propertyInfoValue: IPropertyInfo;
  public isActionSendInvite: boolean = false;
  public usersHaveInvalidEmail: UserProperty[] = [];
  public crmSystemId;
  public ERentPropertyStatus = ERentPropertyStatus;
  public EContactPageType = EContactPageType;
  public selectedAgency: string = '';
  public selectionModel = new SelectionModelPaging(true, []);
  readonly NO_PROPERTY = NO_PROPERTY;
  readonly EEntityType = EEntityType;
  public toolbarConfig = [
    {
      icon: 'appUserWhite',
      label: 'Tenant app invite',
      type: EActionUserType.APP_INVITE,
      disabled: this.activeMobileApp,
      action: () => {
        this.handleEventRow({
          type: EActionUserType.APP_INVITE,
          data: this.selectionModel.selected,
          contactPageType: this.environmentType
        });
      }
    },
    {
      icon: 'mailThin',
      label: 'Send email',
      type: EActionUserType.SEND_MSG,
      disabled: false,
      dataE2e: 'contact-page-float-popup-bulk-message-button',
      action: () => {
        this.handleEventRow({
          type: EActionUserType.SEND_MSG,
          data: this.selectionModel.selected,
          contactPageType: this.environmentType
        });
      }
    },
    {
      icon: 'deleted',
      label: 'Delete',
      type: EActionUserType.DELETE_PERSON,
      disabled: false,
      action: () => {
        this.handleEventRow({
          type: EActionUserType.DELETE_PERSON,
          data: this.selectionModel.selected,
          contactPageType: this.environmentType
        });
      }
    },
    {
      icon: 'iconCloseV2',
      type: ETypeToolbar.Close,
      disabled: false,
      action: () => {
        this.handleClearSelected();
      }
    }
  ];
  public containerHeight: SafeStyle;
  public prePropertyName: string = '';
  public propertyElementWidth = '';
  public listPropertyNames;
  public sentUsersCount = 0;
  public currentUserDetail: IAgentUserProperties;
  public ETypePage = ETypePage;
  public disableExportButton: boolean = false;
  private targetOpenForm: EActionUserType;
  private unsubscribe = new Subject<void>();
  private successMsgTimeOut: NodeJS.Timeout = null;
  private changeListContactsTimeOut: NodeJS.Timeout = null;
  public propertyProfileParams = {
    propertyId: '',
    userId: '',
    userType: ''
  };
  isDeleting: boolean = false;
  isAddingEmail: boolean = false;

  get prePropertyContact(): IContactItemFormatted<
    | IAgentUserProperties
    | ISourceProperty
    | IUserPropertyGroup
    | IUserProperties
  > {
    return this.listAgentUserProperties?.find(
      (item) => this.prePropertyName === item?.data?.streetline
    );
  }

  constructor(
    private sharedService: SharedService,
    private agencyService: AgencyService,
    private conversationService: ConversationService,
    private userService: UserService,
    private toastService: ToastrService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private taskEditorListViewService: TaskEditorListViewService,
    private userAgentService: UserAgentService,
    private userAgentApiService: UserAgentApiService,
    private websocketService: RxWebsocketService,
    private sanitizer: DomSanitizer,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private messageFlowService: MessageFlowService,
    private UserTypeInPTPipe: UserTypeInPTPipe,
    private preventButtonService: PreventButtonService,
    private userInfoDrawerService: UserInfoDrawerService,
    private store: Store,
    public readonly propertyProfileService: PropertyProfileService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageIndex']?.currentValue === 0) {
      this.viewport?.scrollTo({ top: 0 });
    }
    const { increaseHeaderHeight, listAgentUserProperties } = changes || {};
    if (increaseHeaderHeight) {
      this.containerHeight = this.sanitizer.bypassSecurityTrustStyle(
        'calc(100vh - ' +
          (208 + (increaseHeaderHeight.currentValue || 0)) +
          'px)'
      );
    }
    if (listAgentUserProperties?.currentValue) {
      const currentListAgentUserProperties =
        listAgentUserProperties?.currentValue;
      this.listPropertyNames = currentListAgentUserProperties.filter(
        (item) =>
          item?.data['displayAddress'] &&
          item.dataType === ETypeContactItem.PROPERTY
      );
      this.handleMapFullNameOfContact();
      const lastViewItemIndex: number =
        currentListAgentUserProperties.findIndex(
          (item) => item.data.streetline === this.prePropertyName
        );
      this.changeListContactsTimeOut = setTimeout(() => {
        this.checkPropertyAddressName();
        if (
          this.environmentType === EContactPageType.PT &&
          this.pageIndex !== 0 &&
          this.searchValue
        ) {
          this.viewport?.scrollToIndex(lastViewItemIndex);
        }
      }, 0);
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedService
      .isGlobalSearching$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_) => {
        this.handlePopupState({
          isShowUserInfo: false
        });
      });
    this.updateToolbarConfig();
    this.subscribeToSocketNotifySendBulkMessageDone();
    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status: boolean) => {
        this.updateToolbarConfig(status);
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.selectedAgency = company?.id;
        this.crmSystemId = company?.CRM;
        this.environmentType = this.agencyService.isRentManagerCRM(company)
          ? EContactPageType.RM
          : EContactPageType.PT;
      });

    this.userService
      .getSearchText()
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchValue = searchText?.trim();
      });
    this.userInfoDrawerService.sendMsg$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.state) {
          this.handlePopupState({ isShowUserInfo: false });
        }
      });
    this.subscribeAddSecondaryEmail();
    this.subscribeDeleteEmail();
  }

  trackById(index: number): number {
    return index;
  }

  updateToolbarConfig(status?: boolean) {
    this.toolbarConfig = this.toolbarConfig.map((item) => {
      if (item.type === EActionUserType.APP_INVITE) {
        return { ...item, disabled: !status || this.isConsole };
      }
      if (item.type === EActionUserType.DELETE_PERSON) {
        return { ...item, disabled: this.isConsole };
      }
      return item;
    });
  }

  subscribeAddSecondaryEmail() {
    this.userService.isAddEmail$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((newEmail) =>
        this.mapListAgentUserByAction(EActionUserType.ADD_MAIL, newEmail)
      );
  }

  subscribeDeleteEmail() {
    this.userService.isDeletedEmail$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((mailDeletedId) => {
        this.mapListAgentUserByAction(
          EActionUserType.DELETE_SECONDARY_EMAIL,
          mailDeletedId
        );
      });
  }

  handleCheckRow(item): void {
    item.isChecked = !item.isChecked;
    if (item.isChecked) {
      this.selectionModel.select(item);
    } else {
      this.selectionModel.deselect(item, 'userPropertyId');
    }
    if (this.selectionModel.selected.length) {
      this.taskEditorListViewService.getListToolbarTaskEditor(
        this.toolbarConfig,
        this.selectionModel.selected,
        true
      );
    } else {
      this.taskEditorListViewService.setListToolbarConfig([]);
    }
    this.handleSelected();
  }

  handleSelected() {
    this.listAgentUserProperties = this.listAgentUserProperties.map((item) => {
      if (item.dataType === ETypeContactItem.CONTACT) {
        item = {
          ...item,
          isChecked: !!this.selectionModel.selected?.find(
            (select) => select?.userPropertyId === item?.data['userPropertyId']
          )
        };
      }
      return item;
    });
    this.userAgentService.setListSelected$ = this.selectionModel.selected;
  }

  handleClearSelected() {
    this.selectionModel.resetAll();
    // reset selected options
    this.listAgentUserProperties = this.listAgentUserProperties.map(
      (userProperty) => {
        return { ...userProperty, isChecked: false };
      }
    );
    this.taskEditorListViewService.setListToolbarConfig([]);
    this.userAgentService.setListSelected$ = [];
  }

  handleSendInvite() {
    const body = {
      userProperties: []
    };
    body.userProperties = this.selectedUser.map((el) => {
      return {
        userId: el.userId,
        propertyId: el.propertyId
      };
    });
    this.userAgentService.resetCollection$.next(true);
    this.userService
      .sendBulkAppInvite(body)
      .pipe(
        finalize(() => {
          this.handleRefreshList.emit({ refreshed: true });
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.message?.message) {
            this.toastService.clear();
          }
          this.userAgentService.resetCollection$.next(true);
        },
        error: (_) => {
          this.toastService.clear();
        }
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  handleEventRow(e) {
    const { userPropertyId, propertyId } = e?.data || {};
    this.userPropertiesSelected = e?.data;
    this.targetOpenForm = e?.type;
    switch (e?.type) {
      case EActionUserType.ADD_NOTE:
        this.handlePopupState({
          addNotePropertyInfo: true,
          propertyInfo: false
        });
        break;
      case EActionUserType.PEOPLE:
        if (e?.data?.status === ERentPropertyStatus.DELETED) return;

        this.propertyProfileParams = {
          propertyId,
          userId: userPropertyId,
          userType: e?.data.type
        };
        this.handlePopupState({ visiblePropertyProfile: true });
        break;
      case EActionUserType.ADD_MAIL:
        this.handlePopupState({ isShowAddEmail: true });
        break;
      case EActionUserType.DELETE_SECONDARY_EMAIL:
        this.handlePopupState({ isShowDeleteUser: true });
        this.textConfirm = {
          ...this.textConfirm,
          title: `Are you sure you want to delete the email ${e.data?.email}`,
          contentText: ''
        };
        break;
      case EActionUserType.DELETE_SECONDARY_PHONE:
        const { phoneNumber } = this.userPropertiesSelected || {};
        this.textConfirm = {
          ...this.textConfirm,
          title: `Are you sure you want to delete the phone ${this.phoneNumberFormatPipe.transform(
            phoneNumber
          )}`,
          contentText: ''
        };
        this.handlePopupState({ isShowDeleteUser: true });
        break;
      case EActionUserType.PROPERTY:
        if (
          (this.environmentType === EContactPageType.RM &&
            e.data.displayAddress === NO_PROPERTY) ||
          e?.data?.status === ERentPropertyStatus.DELETED
        )
          return;

        this.propertyProfileParams = {
          propertyId,
          userId: '',
          userType: ''
        };
        this.handlePopupState({ visiblePropertyProfile: true });
        break;
      case EActionUserType.APP_INVITE:
        this.handleSendInviteOrSendMsgAction(e, true);
        break;
      case EActionUserType.SEND_MSG:
        this.handleSendInviteOrSendMsgAction(e, false);
        break;
      case EActionUserType.DELETE_PERSON:
        this.textConfirm = {
          ...this.textConfirm,
          title: 'Delete this user',
          contentText:
            'This will delete their Trudi account and leave them unable to log into the tenant app.'
        };
        this.selectedUser = e.data;
        this.handlePopupState({ isShowDeleteUser: true });
        break;
      default:
        break;
    }
  }

  filterInvalidEmailUsers(users) {
    const regExp = EMAIL_FORMAT_REGEX;
    return users.filter((user) => !regExp.test(user?.email));
  }

  handleSendInviteOrSendMsgAction(e, isActionSendInvite: boolean) {
    this.isActionSendInvite = isActionSendInvite;
    this.selectedUser = e?.data;
    this.usersHaveInvalidEmail = this.filterInvalidEmailUsers(
      this.selectedUser
    );

    if (isActionSendInvite || this.usersHaveInvalidEmail.length) {
      this.handlePopupState({ isSendInvite: true });
      return;
    }
    const shouldHandleProcess = this.preventButtonService.shouldHandleProcess(
      EButtonCommonKey.CONTACT_PAGE_SMG,
      EButtonType.COMMON
    );
    if (!shouldHandleProcess) return;
    const regExp = EMAIL_FORMAT_REGEX;
    if (e.type === EActionUserType.SEND_MSG) {
      this.createNewConversationConfigs = {
        ...this.createNewConversationConfigs,
        'body.prefillReceiversList': this.selectedUser
          .filter(({ email }) => email && regExp.test(email))
          .map(({ userId, propertyId = null, streetline }) => ({
            id: userId,
            propertyId: propertyId,
            streetLine: streetline
          })),
        'otherConfigs.isShowGreetingSendBulkContent': true
      };
      this.handleSendMsgFlow();
    }
  }

  handleSendMsgFlow() {
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Quit:
            this.handleCloseModal(this.ACTION_TYPE.SEND_MSG);
            break;
          case ESendMessageModalOutput.MessageSent:
            if (rs.data?.isDraft) return;
            this.onSendMsg(rs.data);
            break;
        }
      });
  }

  handleCloseModal(type: EActionUserType) {
    switch (type) {
      case EActionUserType.DELETE_PERSON:
        this.handlePopupState({ isShowDeleteUser: false });
        break;
      case EActionUserType.ADD_MAIL:
        this.handlePopupState({ isShowAddEmail: false });
        break;
      case EActionUserType.PROPERTY:
        this.handlePopupState({ propertyInfo: false });
        break;
      case EActionUserType.APP_INVITE:
        this.handlePopupState({ isSendInvite: false });
        break;
      case EActionUserType.SEND_MSG:
        this.handlePopupState({ isShowSendMessageModal: false });
        break;
      case EActionUserType.ADD_NOTE:
        this.resetPopupState();
        break;
      case EActionUserType.PEOPLE:
        this.handlePopupState({ isShowUserInfo: false });
        break;
      case EActionUserType.EXPORT_HISTORY:
        this.handlePopupState({ isShowExportSuccess: false });
        break;
      case EActionUserType.PROPERTY_PROFILE:
        this.handlePopupState({ visiblePropertyProfile: false });
        break;
      default:
        break;
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event.type === ISendMsgType.SCHEDULE_MSG && !event?.isDraft) {
          if (event.receivers?.length === 1) {
            const dataForToast = {
              conversationId:
                event.data?.[0]?.conversationId ||
                (event.data as ISendMsgResponseV2)?.conversation?.id ||
                (event.data as any)?.jobReminders?.[0]?.conversationId,
              taskId:
                event.data?.[0]?.taskId ||
                (event.data as ISendMsgResponseV2)?.task?.id ||
                (event.data as any)?.jobReminders?.[0]?.taskId,
              isShowToast: true,
              type: SocketType.send,
              mailBoxId: event.mailBoxId || (event.data as any)?.mailBoxId,
              taskType: TaskType.MESSAGE,
              pushToAssignedUserIds: [],
              status: TaskStatusType.inprogress
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          } else if (event.receivers?.length > 1) {
            const messageLabel = `${event.receivers.length} messages ${
              event.type === ISendMsgType.SCHEDULE_MSG
                ? 'scheduled for send'
                : 'sent'
            } `;
            this.toastService.success(messageLabel);
          }
        }
        this.sentUsersCount = event.receivers?.length || 0;
        this.handlePopupState({
          isShowSuccessMessageModal: true,
          isShowSendMessageModal: false
        });
        this.successMsgTimeOut = setTimeout(() => {
          this.handlePopupState({ isShowSuccessMessageModal: false });
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
          this.handleClearSelected();
          this.handleRefreshList.emit({ refreshed: true });
        }, 2000);
        break;
      case ESentMsgEvent.ERR:
        break;
      default:
        break;
    }
  }

  showModalHistoryConversation(e) {
    if (e) {
      this.selectedUserPropertiesId = e;
      this.handlePopupState({
        isShowExportSuccess: true,
        isShowUserInfo: false
      });
    }
  }

  exportConversationHistory() {
    this.disableExportButton = true;
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.conversationService
      .exportHistoryConversation(this.selectedUserPropertiesId, clientTimeZone)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        error: () => {
          this.disableExportButton = false;
          this.handlePopupState({
            isShowExportSuccess: false
          });
        },
        complete: () => {
          this.handlePopupState({
            isShowExportSuccess: false,
            isShowUserModal: true
          });
          this.handleRefreshList.emit({ refreshed: true });
        }
      });
  }

  onScrollDown() {
    this.checkPropertyAddressName();
    if (
      this.agentListLength >= this.totalItems ||
      this.pageIndex + 1 >= this.totalPages
    )
      return;
    this.handleMapFullNameOfContact();
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    const isCompletedScroll = this.userAgentService.isCompletedScroll$.value;
    if (
      distanceFromBottom <= SCROLL_THRESHOLD &&
      this.pageIndex < this.totalPages &&
      isCompletedScroll
    ) {
      const actionCreator =
        this.typePage === ETypePage.TENANTS_LANLORDS_RM
          ? tenantsOwnersRMPageActions
          : tenantsOwnersPTPageActions;
      this.store.dispatch(actionCreator.nextPage());
    }
  }

  handleMapFullNameOfContact() {
    if (this.environmentType === EContactPageType.RM) return;
    this.listAgentUserProperties = this.listAgentUserProperties.map((item) => {
      if (item.dataType === ETypeContactItem.CONTACT) {
        return {
          ...item,
          data: {
            ...item.data,
            fullName: this.sharedService.displayName(
              item.data?.['firstName'],
              item.data?.['lastName']
            ),
            displayType:
              this.environmentType === EContactPageType.PT
                ? this.UserTypeInPTPipe.transform(
                    item.data['displayType'],
                    true,
                    {
                      contactType: item.data?.['userPropertyContactType']?.type,
                      isPrimary: item.data['isPrimary'],
                      type: item.data['type']
                    },
                    false,
                    true
                  ).split('/ ')
                : item.data['displayType']
          }
        };
      }
      return item;
    });
  }

  checkPropertyAddressName() {
    const element = this.viewport?.elementRef.nativeElement;
    const propertyElements = document.querySelectorAll(
      'cdk-virtual-scroll-viewport property-unit-item span.property-name'
    );
    const visibleProperty = Array.from(propertyElements).find((item) => {
      return item.getBoundingClientRect().y >= 0;
    });
    const elCoordinates = visibleProperty?.getBoundingClientRect();

    if (elCoordinates?.y <= element?.offsetTop) {
      this.prePropertyName = visibleProperty?.textContent;
    } else {
      const visiblePropertyInList = this.listPropertyNames?.find(
        (item) => item.data?.['displayAddress'] === visibleProperty?.textContent
      );
      const indexOfVisibleProperty = this.listPropertyNames?.indexOf(
        visiblePropertyInList
      );
      if (this.listPropertyNames?.[indexOfVisibleProperty - 1]) {
        this.prePropertyName =
          this.listPropertyNames[indexOfVisibleProperty - 1]?.data[
            'displayAddress'
          ];
      }
    }

    if (element?.scrollTop <= 5) {
      this.prePropertyName = '';
    }
  }

  handleAddNewEmail(email: string) {
    if (this.isAddingEmail) return;
    const { userId, propertyId } = this.userPropertiesSelected || {};
    this.isAddingEmail = true;
    this.addEmailErr = '';
    this.userService
      .addSecondaryEmailToContact(userId, email, propertyId)
      .pipe(
        finalize(() => (this.isAddingEmail = false)),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: (res) => {
          this.handlePopupState({ isShowAddEmail: false });
          this.mapListAgentUserByAction(EActionUserType.ADD_MAIL, res);
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
        }
      });
  }

  mapListAgentUserByAction(
    action: EActionUserType,
    value: string | SecondaryEmail
  ) {
    const filterById = (
      items: SecondaryEmail[] | SecondaryPhone[],
      id: string
    ) => items.filter((item) => item.id !== id);

    this.listAgentUserProperties = this.listAgentUserProperties.map((user) => {
      switch (action) {
        case EActionUserType.ADD_MAIL:
          const newEmail = value as SecondaryEmail;
          const { userId, propertyId, secondaryEmails } = user.data || {};
          if (
            userId === newEmail.userId &&
            propertyId === newEmail.propertyId &&
            !!secondaryEmails
          ) {
            user.data['secondaryEmails'] = [...secondaryEmails, newEmail];
          }
          break;
        case EActionUserType.DELETE_SECONDARY_EMAIL:
          {
            const idToDelete = value as string;
            if (!!user.data['secondaryEmails']?.length) {
              user.data['secondaryEmails'] = filterById(
                user.data['secondaryEmails'],
                idToDelete
              );
            }
          }
          break;
        case EActionUserType.DELETE_SECONDARY_PHONE:
          {
            const idToDelete = value as string;
            if (!!user.data['secondaryPhones']?.length) {
              user.data['secondaryPhones'] = filterById(
                user.data['secondaryPhones'],
                idToDelete
              );
            }
          }
          break;
        default:
          break;
      }
      return { ...user };
    });
  }

  onDeleteConfirm() {
    if (this.isDeleting) return;
    this.isDeleting = true;
    const { api, nextFunction } =
      this.getMapAPIDeleteData()?.[this.targetOpenForm] || {};

    if (!api) {
      this.isDeleting = false;
      return;
    }

    api
      .pipe(
        finalize(() => {
          nextFunction();
          this.handlePopupState({ isShowDeleteUser: false });
          this.isDeleting = false;
        })
      )
      .subscribe({
        error: () => {
          this.handlePopupState({ isShowDeleteUser: false });
          this.isDeleting = false;
        }
      });
  }

  getMapAPIDeleteData(): Record<
    string,
    {
      api: Observable<any>;
      nextFunction: () => void;
    }
  > {
    const { id } = this.userPropertiesSelected || {};
    return {
      [EActionUserType.DELETE_SECONDARY_EMAIL]: {
        api: this.userService.deleteSecondaryEmail(id),
        nextFunction: () => {
          this.mapListAgentUserByAction(
            EActionUserType.DELETE_SECONDARY_EMAIL,
            id
          );
        }
      },
      [EActionUserType.DELETE_SECONDARY_PHONE]: {
        api: this.userService.deleteSecondaryPhone(id),
        nextFunction: () => {
          this.mapListAgentUserByAction(
            EActionUserType.DELETE_SECONDARY_PHONE,
            id
          );
        }
      },
      [EActionUserType.DELETE_PERSON]: {
        api: this.getDeletePersonAPI(),
        nextFunction: () => {
          this.taskEditorListViewService.setListToolbarConfig([]);
          this.handleRefreshList.emit({ refreshed: true });
          this.handleClearSelected();
        }
      }
    };
  }

  getDeletePersonAPI() {
    const idList: string[] = this.selectedUser
      .map((el: UserProperty) => el?.userId)
      .filter(Boolean);
    this.userAgentService.resetCollection$.next(true);
    return this.userAgentApiService.onDeleteUserAgent({ ids: idList });
  }

  handleSuccessConfirmSendInvite(item: CheckedUser) {
    if (this.isActionSendInvite) {
      this.toastService.show(
        'Invite sending...',
        '',
        { disableTimeOut: true },
        'toast-info'
      );
      this.handleSendInvite();
      this.handlePopupState({ isSendInvite: item.status });
    } else {
      const regExp = EMAIL_FORMAT_REGEX;
      this.createNewConversationConfigs = {
        ...this.createNewConversationConfigs,
        'body.prefillReceiversList': this.selectedUser
          .filter(({ email }) => email && regExp.test(email))
          .map(({ userId, propertyId = null, streetline }) => ({
            id: userId,
            propertyId: propertyId,
            streetLine: streetline
          }))
      };

      this.handlePopupState({
        isSendInvite: false
      });

      this.handleSendMsgFlow();
    }
    this.handleClearSelected();
  }

  resetPopupState() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
  }

  statusProperty($event) {
    this.isExpandProperty = $event;
  }

  statusExpandProperty($event) {
    this.isExpandProperty = $event;
  }

  isShowModalAdd($event) {
    this.isShowPropertyInfo = false;
    this.handlePopupState({ addNotePropertyInfo: true, propertyInfo: true });
  }

  onSubmitAddNote() {
    this.isShowPropertyInfo = true;
    this.handlePopupState({ addNotePropertyInfo: false });
  }

  handleBackAddNote(event) {
    this.isShowPropertyInfo = true;
    this.handlePopupState({ propertyInfo: !event, addNotePropertyInfo: event });
  }

  subscribeToSocketNotifySendBulkMessageDone() {
    this.websocketService.onSocketNotifySendBulkMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        let messageLabel = '';
        if (data?.messages?.[0]?.isDraft) return;
        if (data.status === SyncPropertyDocumentStatus.SUCCESS) {
          if (data.messageSended === 1) {
            const dataForToast = {
              conversationId: data.messages[0]?.conversationId,
              taskId: data.messages[0].taskId,
              isShowToast: true,
              type: SocketType.newTask,
              mailBoxId: data.mailBoxId,
              taskType: data.taskType || TaskType.MESSAGE,
              pushToAssignedUserIds: [],
              status: data.messages[0].status
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          } else {
            messageLabel = `${data.messageSended} messages`;
            this.toastService.success(`${messageLabel} sent`);
          }
        } else {
          let messageFailed = data.totalMessage - data.messageSended;
          messageLabel = `${messageFailed} ${
            messageFailed === 1 ? 'message' : 'messages'
          }`;
          this.toastService.error(
            `${data.totalMessage - data.messageSended} failed to send`
          );
        }
      });
  }
  ngOnDestroy(): void {
    this.taskEditorListViewService.setListToolbarConfig([]);
    this.userAgentService.setListSelected$ = [];
    clearTimeout(this.successMsgTimeOut);
    clearTimeout(this.changeListContactsTimeOut);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

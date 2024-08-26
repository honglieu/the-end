import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {
  EConversationStatus,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import {
  ContactTitleByConversationPropertyPipe,
  EDataE2EReassignModal,
  EPropertyStatus,
  ESyncToRmStatus,
  IAssignedAgentValue,
  IParticipant,
  PreviewConversation,
  SocketType,
  sortSuggestedProperties,
  SyncMaintenanceType,
  TaskItem,
  TaskStatusType,
  TaskType,
  TypeConversationPropertyPayload,
  UserConversation,
  UserPropertyInPeople
} from '@/app/shared';
import { WhatsappMenuService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-menu.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { PropertiesService } from '@/app/services/properties.service';
import { ToastrService } from 'ngx-toastr';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import { SyncMessagePropertyTreeService } from '@/app/services/sync-message-property-tree.service';
import { ConversationService } from '@/app/services/conversation.service';
import { Store } from '@ngrx/store';
import { whatsappDetailApiActions } from '@/app/core/store/whatsapp-detail/actions/whatsapp-detail-api.actions';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { BelongToOtherPropertiesText } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-message-detail-list/components/sms-message-detail-header/sms-message-detail-header.component';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { SharedService } from '@/app/services';

@Component({
  selector: 'whatsapp-view-detail-header',
  templateUrl: './whatsapp-view-detail-header.component.html',
  styleUrls: ['./whatsapp-view-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappViewDetailHeaderComponent implements AfterViewInit {
  @ViewChild('headerElementRef') headerElementRef: ElementRef;
  @Input() set conversation(conversation: PreviewConversation) {
    this.conversation$.next(conversation);
  }
  @Input() set task(task: TaskItem) {
    this.task$.next(task);
  }
  @Input() isUserVerified = false;
  @Input() isRmEnvironment = false;
  @Input() isConsole = false;
  @Input() isArchivedMailbox = false;

  @Output() openProfileDrawer = new EventEmitter<MouseEvent>();
  @Output() openPropertyDrawer = new EventEmitter<boolean>();

  listPropertyAllStatus: UserPropertyInPeople[];
  showHeaderContactTooltip: boolean = window.innerWidth <= 1440;
  isThreeDotMenuVisible: boolean = false;
  isReassignPropertyModalVisible: boolean = false;
  isPropertyProfileVisible: boolean = false;
  isReassigningProperty: boolean = false;
  isUrgent: boolean = false;
  isReadMsg: boolean = false;
  disabledDownloadPDF: boolean;
  disabledSyncPT: boolean;
  toolTipProperty: string = '';
  formSelectProperty: FormGroup;
  isSyncInprogress = false;
  isSyncSuccess = false;
  renderStrategy: RxStrategyNames = 'immediate';
  menuOptionDisable = {
    [MenuOption.UNREAD]: false,
    [MenuOption.READ]: false,
    [MenuOption.UN_FLAG]: false,
    [MenuOption.FLAG]: false,
    [MenuOption.SAVE_TO_PROPERTY_TREE]: false,
    [MenuOption.DOWNLOAD_AS_PDF]: false
  };
  public isLoadingDetailHeader: boolean = false;

  readonly EConversationStatus = EConversationStatus;
  readonly EDataE2EReassignModal = EDataE2EReassignModal;
  readonly MenuOption = MenuOption;
  readonly EPropertyStatus = EPropertyStatus;
  readonly BelongToOtherPropertiesText = BelongToOtherPropertiesText;

  private readonly task$ = new BehaviorSubject<TaskItem | null>(null);
  private readonly conversation$ =
    new BehaviorSubject<PreviewConversation | null>(null);
  private destroy$ = new Subject<void>();
  contactTitleVariable = {
    isNoPropertyConversation: false,
    isMatchingPropertyWithConversation: true
  };

  readonly headerContext$ = combineLatest([
    this.task$,
    this.conversation$
  ]).pipe(
    filter(([task, conversation]) => !!task && !!conversation),
    map(([task, conversation]) => {
      const isSyncInprogress =
        [ESyncToRmStatus.PENDING, ESyncToRmStatus.INPROGRESS].includes(
          conversation?.syncStatus as ESyncToRmStatus
        ) ||
        [ESyncToRmStatus.PENDING, ESyncToRmStatus.INPROGRESS].includes(
          conversation?.conversationSyncDocumentStatus as ESyncToRmStatus
        );
      const isSyncSuccess =
        [ESyncToRmStatus.COMPLETED, ESyncToRmStatus.SUCCESS].includes(
          conversation?.syncStatus as ESyncToRmStatus
        ) ||
        [ESyncToRmStatus.SUCCESS].includes(
          conversation?.conversationSyncDocumentStatus as ESyncToRmStatus
        );
      const isReadMsg = task.conversations.every((msg) => msg.isSeen);
      const isUrgent = task.conversations.every((msg) => msg.isUrgent);
      const { id: propertyId, isTemporary: isTemporaryProperty } =
        task.property || {};
      return {
        task,
        conversation,
        isSyncInprogress,
        isSyncSuccess,
        isReadMsg,
        isUrgent,
        toolTipProperty: this.propertiesService.getTooltipPropertyStatus({
          propertyStatus: conversation?.propertyStatus,
          type: conversation?.propertyType
        }),
        header: this.composeHeader(task, conversation),
        userInfo: this.smsMessageListService.getUserRaiseMsgFromParticipants({
          ...conversation,
          propertyId,
          isTemporaryProperty
        } as UserConversation)
      };
    })
  );

  get propertyIdFormControl(): AbstractControl<string> {
    return this.formSelectProperty.get('propertyId') as AbstractControl<string>;
  }

  constructor(
    private readonly toastCustomService: ToastCustomService,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappMenuService: WhatsappMenuService,
    private readonly propertiesService: PropertiesService,
    private readonly toastrService: ToastrService,
    private readonly cdr: ChangeDetectorRef,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private readonly conversationService: ConversationService,
    private readonly contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly store: Store,
    private smsMessageListService: SmsMessageListService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {
    this.buildReassignPropertyForm();
    this.subscribeSyncStatusMessage();
    this.subscribeListProperties();
    this.headerContext$
      .pipe(
        distinctUntilChanged((previous, current) => {
          return (
            previous?.conversation?.userId === current?.conversation?.userId
          );
        })
      )
      .subscribe(() => {
        this.sharedService.setLoadingDetailHeader(false);
      });
    this.subscribeLoadingDetailHeader();
  }

  subscribeLoadingDetailHeader() {
    this.sharedService.getLoadingDetailHeader().subscribe((res) => {
      this.isLoadingDetailHeader = res;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.renderStrategy = 'low';
  }

  subscribeSyncStatusMessage() {
    this.syncMessagePropertyTreeService.listConversationStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        if (
          listMessageSyncStatus.conversationIds.includes(
            this.conversation$.value?.id
          )
        ) {
          this.disabledDownloadPDF = listMessageSyncStatus?.downloadingPDFFile;
          this.disabledSyncPT = [
            SyncMaintenanceType.INPROGRESS,
            SyncMaintenanceType.PENDING
          ].includes(
            (listMessageSyncStatus?.status ||
              listMessageSyncStatus?.conversationSyncDocumentStatus) as SyncMaintenanceType
          );
          this.conversation$.next({
            ...this.conversation$.value,
            syncStatus:
              listMessageSyncStatus.conversationSyncDocumentStatus ||
              listMessageSyncStatus.status,
            conversationSyncDocumentStatus:
              listMessageSyncStatus.conversationSyncDocumentStatus,
            conversationSyncDocumentAt: new Date(
              listMessageSyncStatus?.timestamp
            ).toString()
          });
        }
        this.cdr.markForCheck();
      });
  }

  private buildReassignPropertyForm(): void {
    this.formSelectProperty = new FormGroup({
      propertyId: new FormControl<string | null>(null)
    });
  }

  private composeHeader(task: TaskItem, conversation: PreviewConversation) {
    const currentParticipant = conversation.participants?.[0] as IParticipant;
    const { isTemporary, id: propertyId } = task.property || {};
    if (!currentParticipant) return {};

    return {
      title: this.contactTitleByConversationPropertyPipe.transform(
        currentParticipant,
        {
          isNoPropertyConversation: isTemporary,
          isMatchingPropertyWithConversation:
            currentParticipant.propertyId === propertyId,
          skipClientName: true,
          showOnlyName: true
        }
      ),
      role: this.contactTitleByConversationPropertyPipe.transform(
        currentParticipant,
        {
          isNoPropertyConversation: isTemporary,
          isMatchingPropertyWithConversation:
            currentParticipant.propertyId === propertyId,
          showOnlyRole: true,
          showCrmStatus: true,
          showPrimaryText: true
        }
      )
    };
  }

  private subscribeListProperties(): void {
    combineLatest({
      suggestedPropertyIds: combineLatest([
        this.task$,
        this.userProfileDrawerService.trigerRefreshListProperty$
      ]).pipe(
        distinctUntilChanged(([prevTask, _], [currTask, currTrigger]) => {
          // Compare only the conversation id to determine if it has changed
          return (
            prevTask?.conversations[0]?.id === currTask?.conversations[0]?.id &&
            prevTask?.conversations[0]?.userId ===
              currTask?.conversations[0]?.userId &&
            !currTrigger
          );
        }),
        switchMap(([task, _]) => {
          const conversationId = task?.conversations[0]?.id;
          return conversationId
            ? this.conversationService.getSuggestedProperty(conversationId)
            : of([]);
        })
      ),
      propertiesList: this.propertiesService.listPropertyAllStatus
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.listPropertyAllStatus = sortSuggestedProperties(data);
        },
        error: () => {}
      });
  }

  handleMenu(
    option: MenuOption,
    field: string,
    task: TaskItem,
    event?: MouseEvent
  ): void {
    this.menuOptionDisable[option] = ![
      MenuOption.SAVE_TO_PROPERTY_TREE,
      MenuOption.DOWNLOAD_AS_PDF
    ].includes(option);
    const disableSaveToPT =
      option === MenuOption.SAVE_TO_PROPERTY_TREE &&
      (this.isArchivedMailbox || this.disabledSyncPT);
    const disableDownloadPDF =
      option === MenuOption.DOWNLOAD_AS_PDF && this.disabledDownloadPDF;
    if (
      (this.isConsole && option !== MenuOption.DOWNLOAD_AS_PDF) ||
      disableSaveToPT ||
      disableDownloadPDF
    ) {
      if (event) event.stopPropagation();
      return;
    }
    if ([MenuOption.RESOLVE, MenuOption.REOPEN].includes(option)) {
      this.inboxService.isLoadingDetail.next(true);
    }
    this.whatsappMenuService
      .handleMenuChange({ message: task, option }, this.conversation$.value)
      .then((value) => {
        if (!value) return;
        this.isThreeDotMenuVisible = false;
        if ([MenuOption.RESOLVE, MenuOption.REOPEN].includes(option)) {
          this.openToast(task, option);
        }
        this.whatsappService.setMenuRightClick({
          taskId: task.id,
          conversationId: task.conversations[0].id,
          field,
          value,
          option
        });
        this.updateCurrentWhatsapp(field, value, task, option);
        this.menuOptionDisable[option] = false;
        this.inboxService.isLoadingDetail.next(false);
      });
  }

  private openToast(item: TaskItem, option: MenuOption): void {
    const dataForToast = {
      conversationId: item.conversations[0].id,
      taskId: item.conversations[0].taskId,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: item.mailBoxId,
      taskType: TaskType.MESSAGE,
      status:
        option === MenuOption.REOPEN
          ? TaskStatusType.inprogress
          : TaskStatusType.resolved,
      pushToAssignedUserIds: [],
      conversationType: item.conversations[0].conversationType,
      isIdentifier:
        item?.conversations[0]?.isDetectedContact &&
        !(item?.conversations[0]?.participants?.[0] as IParticipant)
          ?.isTemporary
    };
    this.toastCustomService.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN,
      false,
      true
    );
  }

  private updateCurrentWhatsapp(
    field: string,
    value,
    task: TaskItem,
    option: MenuOption
  ): void {
    if (field) {
      const updatedConversations = task.conversations.map((item) =>
        item.id === this.conversation$.value?.id
          ? { ...item, [field]: value[field] }
          : item
      );
      this.whatsappService.setCurrentWhatsappTask({
        ...this.task$.value,
        conversations: updatedConversations
      });
      this.whatsappService.setMenuRightClick({
        taskId: task.id,
        conversationId: this.conversation$.value?.id,
        field,
        value,
        option
      });
    }
  }

  openProfileDrawerHandler(event: MouseEvent): void {
    this.openProfileDrawer.emit(event);
  }

  openPropertyProfileHandler(task: TaskItem): void {
    const { shortenStreetline, streetline, id, status } = task.property || {};
    if (
      status !== EPropertyStatus.deleted &&
      (shortenStreetline || streetline) &&
      id
    ) {
      this.openPropertyDrawer.emit(true);
    }
  }

  openReassignPropertyModalHandler(task: TaskItem): void {
    if (this.isConsole) return;
    const propertyId = task.property?.id;
    if (this.checkIsHasPropertyOnMessageDetail(propertyId)) {
      this.propertyIdFormControl.setValue(propertyId);
    }
    this.isReassignPropertyModalVisible = true;
  }

  private checkIsHasPropertyOnMessageDetail(propertyId: string): boolean {
    return this.listPropertyAllStatus.some((item) => item.id === propertyId);
  }

  reassignPropertyHandler(
    task: TaskItem,
    conversation: PreviewConversation
  ): void {
    this.isReassigningProperty = true;
    const { id, isTemporary } = task.property || {};

    if (
      this.propertyIdFormControl.value === id ||
      (!this.propertyIdFormControl.value && isTemporary) ||
      (!this.propertyIdFormControl.value &&
        !this.checkIsHasPropertyOnMessageDetail(id))
    ) {
      this.isReassigningProperty = false;
      this.isReassignPropertyModalVisible = false;
      this.propertyIdFormControl.reset();
      return;
    }

    const bodyChangeConversationProperty: TypeConversationPropertyPayload = {
      conversationId: conversation.id,
      newPropertyId: this.propertyIdFormControl.value
    };

    this.propertiesService
      .updateConversationProperty(bodyChangeConversationProperty)
      .pipe(finalize(() => (this.isReassigningProperty = false)))
      .subscribe((res) => {
        if (res) {
          this.toastrService.success(
            'The conversation property has been changed'
          );
          this.whatsappService.setReloadWhatsappDetail();
        }
        this.isReassignPropertyModalVisible = false;
        this.propertyIdFormControl.reset();
      });
  }

  closeReassignPropertyModalHandler(): void {
    this.isReassigningProperty = false;
    this.isReassignPropertyModalVisible = false;
    this.propertyIdFormControl.reset();
  }

  assigneeUpdateHandler(event: IAssignedAgentValue): void {
    const { assignToAgents } = event.task;
    this.store.dispatch(
      whatsappDetailApiActions.updateWhatsappTask({
        task: { ...this.task$.value, assignToAgents }
      })
    );
    this.cdr.markForCheck();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const target = event.target as Window;
    this.showHeaderContactTooltip = target.innerWidth <= 1440;
  }
}

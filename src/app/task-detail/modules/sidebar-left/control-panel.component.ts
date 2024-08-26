import { ECategoryType } from '@shared/enum/category.enum';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { skip, takeUntil } from 'rxjs/operators';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ControlPanelService,
  ControlPanelTab
} from './services/control-panel.service';
import { ConversationService } from '@services/conversation.service';
import { FileTabTypes, FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import {
  SendMaintenanceType,
  SyncMaintenanceType
} from '@shared/enum/sendMaintenance.enum';
import { TaskType, TaskStatusType } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { UserConversation } from '@shared/types/conversation.interface';
import {
  LeaseRenewalRequestTrudiResponse,
  PetRequestTrudiResponse,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { LoadingService } from '@services/loading.service';
import { ApiStatusService } from '@services/api-status.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss']
})
@DestroyDecorator
export class ControlPanelComponent implements OnInit, OnDestroy {
  public controlPanelTab = ControlPanelTab;
  public currentProperty: any;
  public propertyName = '';
  public propertyAddress = '';
  private unsubscribe = new Subject<void>();
  private tabList = FileTabTypes;
  canDisplayRightTab: boolean = false;
  isExpanded = false;
  public activeTrudi = false;
  public maintenanceActive = false;
  public isMaintenance = false;
  public statusHeight: string;
  public isSyncing: boolean;
  public popupModalPosition = ModalPopupPosition;
  public isShowQuitConfirmModal = false;
  public amountConversation: number;
  public isDeletedTask: boolean;
  public isReveal: boolean = false;
  readonly ETrudiType = ETrudiType;
  readonly TYPE_MAINTENANCE = SendMaintenanceType;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public isBlankTask: boolean = false;

  public trudiResponseInTask = true;
  public isLeaseRenewal: boolean = false;

  public isCheckAfterViewStatusHeight = false;
  public isActiveFlowPet: boolean = false;
  public paragraph: object = { rows: 0 };
  public taskType = TaskType.TASK;
  public TaskTypeEnum = TaskType;
  private subscription: Subscription;
  public isLoadingSkeleton: boolean = true;
  public typeLoadingTask = false;

  private readonly trudiTypesEnableTrudiTab = [
    ECategoryType.leasing,
    ECategoryType.leaseRenewal,
    ECategoryType.routineInspection,
    ECategoryType.routineMaintenance,
    ECategoryType.petReq,
    ECategoryType.creditorInvoicing,
    ECategoryType.landlordRequest,
    ECategoryType.tenantRequest,
    ECategoryType.emergencyMaintenance,
    ECategoryType.smokeAlarms,
    ECategoryType.generalCompliance,
    ECategoryType.tenantVacate,
    ECategoryType.breachNotice
  ];

  constructor(
    private conversationService: ConversationService,
    public propertyService: PropertiesService,
    private route: ActivatedRoute,
    private router: Router,
    public controlPanelService: ControlPanelService,
    private filesService: FilesService,
    public readonly sharedService: SharedService,
    public popupService: PopupService,
    public taskService: TaskService,
    private headerService: HeaderService,
    private userService: UserService,
    private cdRef: ChangeDetectorRef,
    private loadingService: LoadingService,
    private apiStatusService: ApiStatusService
  ) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // ngAfterViewChecked() {
  //   // check if it change, tell CD update view
  //   if (this.statusHeight === SendMaintenanceType.OPEN) {
  //     this.isCheckAfterViewStatusHeight =
  //       this.statusHeight === SendMaintenanceType.OPEN;
  //     this.cdRef.markForCheck();
  //   }
  // }

  ngOnInit() {
    this.typeLoadingTask =
      this.router.url.includes('type=TASK') ||
      this.router.url.includes('/inbox/detail');
    this.subscription = this.loadingService.isLoading$
      .pipe(skip(1))
      .subscribe((loading) => {
        this.isLoadingSkeleton = loading;
      });
    combineLatest([
      this.apiStatusService.getTriggerEnableSteps,
      this.propertyService.currentPropertyId
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([status, propertyId]) => {
        if (!this.canDisplayRightTab) {
          this.canDisplayRightTab = Boolean(status && propertyId);
        }
      });

    this.subscribeCurrentTaskChanges();
    this.subscribeMaintenanceBottomChanges();
    this.subscribeTrudiResponseConversationChanges();
    this.subscribeIsDeletedTaskChanges();
    this.subscribeToRightSidebarCollapseStateChanges();
    this.subscribeToCurrentProperty();
    this.filesService.currentFileTab.next(this.tabList.appUser);
    this.controlPanelService.currentTab = this.controlPanelTab.trudi;
  }

  checkIsShowMaintenance(
    trudiResponse: LeaseRenewalRequestTrudiResponse | PetRequestTrudiResponse
  ) {
    return (
      trudiResponse &&
      trudiResponse?.type === ETrudiType.ticket &&
      trudiResponse?.setting?.categoryId === ECategoryType.routineMaintenance
    );
  }

  isTrudiActive(
    response:
      | TrudiResponse
      | LeaseRenewalRequestTrudiResponse
      | PetRequestTrudiResponse
  ) {
    const isBlankTask = response?.type === 'task-blank';
    if (!response) {
      return null;
    }
    return (
      response &&
      !isBlankTask &&
      (response.type === ETrudiType.q_a ||
        response.type === ETrudiType.ticket ||
        response.type === ETrudiType.super_happy_path ||
        response.type === ETrudiType.unhappy_path ||
        this.amountConversation === 0)
    );
  }

  getPropertyAddress(prop) {
    if (prop.unitNo && prop.streetNumber) {
      return prop.unitNo?.trim() + '/' + prop.address?.trim();
    }
    if (!prop.unitNo) {
      return prop.address?.trim();
    }
    if (prop.unitNo && !prop.streetNumber) {
      return prop.unitNo?.trim() + '/ ' + prop.address?.trim();
    }
  }

  handleHeightStatus(event) {
    this.statusHeight = event?.statusMaintenance;
    this.isSyncing =
      event?.dataMaintenanceSyncStatus !==
      this.TYPE_SYNC_MAINTENANCE.INPROGRESS;
    this.sharedService.checkStatus.next(event?.statusMaintenance);
  }

  getPropertyStreetLine(prop) {
    return (
      prop.suburb?.trim() +
      (prop.suburb ? ', ' : '') +
      prop.state?.trim() +
      ' ' +
      prop.postCode?.trim()
    );
  }

  onCollapse() {
    this.isExpanded = !this.isExpanded;
    this.sharedService.rightSidebarCollapseState$.next(this.isExpanded);
  }

  deleteTask(event: boolean) {
    if (!event) return;
    const currentTaskId = this.taskService.currentTaskId$.getValue();
    this.taskService
      .changeTaskStatus(currentTaskId, TaskStatusType.deleted)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        const currentTask = this.taskService.currentTask$.getValue();

        this.taskService.moveTaskItem$.next({
          task: currentTask,
          source: currentTask.status.toLowerCase(),
          destination: TaskStatusType.deleted.toLowerCase()
        });

        this.taskService.currentTask$.next({
          ...currentTask,
          status: TaskStatusType.deleted,
          assignToAgents: [
            ...this.headerService.headerState$.value.currentTask.assignToAgents,
            {
              firstName: this.userService.selectedUser.value?.firstName,
              lastName: this.userService.selectedUser.value?.lastName,
              googleAvatar: this.userService.selectedUser.value?.googleAvatar,
              id: this.userService.selectedUser.value?.id,
              fullName: this.sharedService.displayName(
                this.userService.selectedUser.value?.firstName,
                this.userService.selectedUser.value?.lastName
              )
            }
          ]
        });

        this.headerService.headerState$.next({
          ...this.headerService.headerState$.value,
          currentTask: {
            ...this.headerService.headerState$.value?.currentTask,
            status: TaskStatusType.deleted
          }
        });

        const currentConversation =
          this.conversationService.currentConversation?.getValue();
        if (
          currentConversation &&
          currentConversation?.status !== EConversationType.resolved
        ) {
          this.conversationService.trudiChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            currentConversation.id,
            EConversationType.resolved
          );
        }
        this.conversationService.reloadConversationList.next(true);
      });
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirmModal = status;
  }

  checkTypeTrudiResponseToDisplayTrudiTab(
    trudiResponseConversation: UserConversation
  ) {
    return (
      trudiResponseConversation.trudiResponse.type === ETrudiType.q_a ||
      trudiResponseConversation.trudiResponse.type === ETrudiType.ticket ||
      trudiResponseConversation.trudiResponse.type ===
        ETrudiType.super_happy_path
    );
  }

  onScroll() {
    this.controlPanelService.isShowListDecision.next(false);
  }

  subscribeCurrentTaskChanges() {
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((task) => {
        if (!task) return;
        this.taskType = task?.taskType;
        const taskCategoryId =
          task?.trudiResponse?.setting?.categoryId ||
          this.conversationService.trudiResponseConversation.value
            ?.trudiResponse?.setting?.categoryId;
        this.isLeaseRenewal = taskCategoryId === ECategoryType.leaseRenewal;
        this.conversationService.selectedCategoryId.next(taskCategoryId);
        this.isMaintenance = this.checkIsShowMaintenance(
          task?.trudiResponse as
            | LeaseRenewalRequestTrudiResponse
            | PetRequestTrudiResponse
        );
        if (task && task.trudiResponse?.type === 'task-blank') {
          this.isBlankTask = true;
        }
        if (task.trudiResponse) {
          this.trudiResponseInTask =
            this.trudiTypesEnableTrudiTab.includes(
              task.trudiResponse?.setting?.categoryId as ECategoryType
            ) || task.trudiResponse?.['isTemplate'];
        }
        if (
          (task.trudiResponse?.setting?.categoryId as ECategoryType) ===
          ECategoryType.petReq
        ) {
          this.isActiveFlowPet = true;
        }
      });
  }

  subscribeMaintenanceBottomChanges() {
    this.sharedService.maintenanceBottom
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.maintenanceActive = res;
      });
  }

  subscribeTrudiResponseConversationChanges() {
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const response = res;
        if (Array.isArray(response)) {
          this.amountConversation = Array.from(response).length;
        } else {
          this.amountConversation = -1;
        }

        if (res?.trudiResponse?.type !== ETrudiType.super_happy_path) {
          const categoryId =
            this.taskService.currentTask$.value?.trudiResponse?.setting
              ?.categoryId || res?.trudiResponse?.setting?.categoryId;
          this.conversationService.selectedCategoryId.next(categoryId);
        }
      });
  }

  subscribeIsDeletedTaskChanges() {
    this.conversationService.isDeletedTask
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isDeletedTask = res;
        if (!res) {
          this.isDeletedTask =
            this.taskService.currentTask$.value?.taskType ===
              TaskType.MESSAGE &&
            this.taskService.currentTask$.value?.status ===
              TaskStatusType.completed;
        }
      });
  }

  subscribeToRightSidebarCollapseStateChanges() {
    this.sharedService.rightSidebarCollapseState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((e) => (this.isExpanded = e));
  }

  subscribeToCurrentProperty(): void {
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
          this.controlPanelService.reset();
          this.propertyName = this.getPropertyAddress(res);
          this.propertyAddress = this.getPropertyStreetLine(res);
        } else {
          this.propertyName = '';
          this.propertyAddress = '';
        }
      });
  }
}

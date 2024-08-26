import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { MessageService } from '@services/message.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';

import { CallTypeEnum, ImgPath } from '@shared/enum/share.enum';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { CallType } from '@shared/types/share.model';
import { TaskItem } from '@shared/types/task.interface';
import { UserConversationOption } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'app-message-detail-section',
  templateUrl: './message-detail-section.component.html',
  styleUrls: ['./message-detail-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageDetailSectionComponent implements OnInit, OnDestroy {
  public currentConversationId: string;
  public ImgPath = ImgPath;
  public typeOfCall: CallType;
  public callType = CallTypeEnum;
  public requestDataCall: any;
  public popupModalPosition = ModalPopupPosition;
  public taskMsgDetail: TaskItem;
  public currentConversation;
  public trudiResponse;
  public userPropertyType = EUserPropertyType;
  public fullName: string = '';
  private unsubscribe = new Subject<void>();
  public paragraph: object = { rows: 0 };
  public taskId: string;

  public currentConvId: string;
  currentActiveIndex = -1;
  public listOfConversations: UserConversationOption[] = [];

  public popupState = {
    showPeople: false,
    verifyEmail: false,
    emailVerifiedSuccessfully: false,
    confirmCall: false,
    option: false,
    confirmDelete: false,
    isShowForwardViaEmail: false,
    isShowMoveToAnotherTaskModal: false,
    isShowExportSuccess: false
  };
  public isLoading = true;
  public currentAgencyId: string;

  constructor(
    public conversationService: ConversationService,
    public messageService: MessageService,
    public propertiesService: PropertiesService,
    public sharedService: SharedService,
    public cdr: ChangeDetectorRef,
    private propertyService: PropertiesService,
    private activatedRoute: ActivatedRoute,
    public userService: UserService,
    public taskService: TaskService,
    private agencyService: AgencyService
  ) {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.get('taskId')) {
          this.taskId = res.get('taskId');
        }
      });
  }

  ngOnInit(): void {
    this.getDataConversation();

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id) {
          this.currentConvId = res.id;
        }
      });
    combineLatest([this.taskService.currentTask$, this.activatedRoute.paramMap])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([currentTask, res]) => {
        this.currentAgencyId = currentTask?.agencyId;
        if (this.currentAgencyId && res && res.get('taskId')) {
          this.taskId = res.get('taskId');
          this.taskService.currentTaskId$.next(this.taskId);
          this.conversationService
            .getListOfConversationsByTaskId(this.taskId)
            .subscribe((res: UserConversationOption[]) => {
              if (res) {
                this.listOfConversations = res;
                this.taskService.checkAllConversationsInTaskIsRead(
                  this.taskId || this.taskService.currentTaskId$.getValue(),
                  this.taskService.currentTask$.getValue()
                    ?.status as TaskStatusType,
                  this.listOfConversations as UserConversation[]
                );
                this.selectFirstConversationInList();
              }
            });
        }
      });

    this.conversationService.reloadConversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.reloadListConversation();
      });
  }

  requestToCall(type?: CallTypeEnum) {
    const conversationId =
      this.conversationService.currentConversation.value?.id;
    this.messageService.requestToCall.next({ conversationId, type });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  getDataConversation() {
    this.messageService.callButtonData
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.requestDataCall = res;
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        this.currentConversation = res;
        this.fullName = this.sharedService.displayName(
          this.currentConversation?.firstName,
          this.currentConversation?.lastName
        );
        if (
          this.currentConversation?.propertyType ===
          this.userPropertyType.EXTERNAL
        ) {
          this.currentConversation = {
            ...this.currentConversation,
            ExternalType: 'External email'
          };
        }
        this.cdr.markForCheck();
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        this.taskMsgDetail = res;
        this.cdr.markForCheck();
      });
  }

  onInfoUser() {
    this.messageService.requestShowUserInfo.next({
      ...this.messageService.requestShowUserInfo.getValue,
      showModal: true
    });
  }

  onUserProfilePage() {
    this.messageService.requestShowUserProfile.next({
      ...this.messageService.requestShowUserProfile.getValue,
      showModal: true,
      userId: this.currentConversation?.userId,
      propertiesId: this.taskMsgDetail?.property?.id
    });
  }

  onLoadingFilePanel(state: boolean) {
    this.isLoading = state;
  }

  selectFirstConversationInList() {
    let conversation: UserConversationOption =
      this.listOfConversations.find((el) => el.id === this.currentConvId) ||
      this.listOfConversations[0];
    this.openConversation(conversation, 0);
    if (!this.propertyService.currentPropertyId.value) {
      if (conversation?.propertyId) {
        this.propertyService.currentPropertyId.next(conversation?.propertyId);
      }
    }
  }

  openConversation(conversation: any, index: number) {
    let trudiResponse;
    if (this.listOfConversations && this.listOfConversations.length) {
      trudiResponse = this.listOfConversations.find((el) => el.trudiResponse);
    }
    this.currentActiveIndex = index;
    this.conversationService.openConversation(
      conversation,
      trudiResponse || this.listOfConversations
    );
    this.conversationService.resetConversationState();
    this.conversationService.actionLinkList.next([]);
    this.conversationService._actionLinkList = [];
  }

  reloadListConversation() {
    this.conversationService
      .getListOfConversationsByTaskId(this.taskId)
      .subscribe((res) => {
        if (!res) return;
        this.listOfConversations = [...res];
        this.selectFirstConversationInList();
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

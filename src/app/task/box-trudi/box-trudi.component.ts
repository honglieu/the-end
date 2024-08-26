import { takeUntil, tap } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ApiService } from '@services/api.service';
import { SEND_MESSAGE_POPUP_OPEN_FROM, trudiUserId } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { PopupService, PopupState } from '@services/popup.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { IMessage } from '@shared/types/message.interface';
import { EMessageType } from '@shared/enum/messageType.enum';
import { TrudiBody, TrudiButton } from '@shared/types/trudi.interface';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { Subject } from 'rxjs';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { LastUser } from '@shared/types/conversation.interface';
import { IFile } from '@shared/types/file.interface';
import { HeaderService } from '@services/header.service';
import { TaskService } from '@services/task.service';
import { SendMessageService } from '@services/send-message.service';

@Component({
  selector: 'box-trudi',
  templateUrl: './box-trudi.component.html',
  styleUrls: ['./box-trudi.component.scss']
})
export class BoxTrudiComponent implements OnInit, OnChanges {
  @Input() trudiBody: TrudiBody;
  @Input() disable: boolean = false;
  @Output() moveNextStep = new EventEmitter<number>();

  public SEND_MESSAGE_POPUP_OPEN_FROM = SEND_MESSAGE_POPUP_OPEN_FROM;
  public isShowSendMessageModal = false;
  public notEditShow = false;
  public popupModalPosition = ModalPopupPosition;
  public isShowQuitConfirm = false;
  public isShowSuccessInviteModal = false;
  public isShowSecceessMessageModal = false;
  public isShowUserModal = false;
  public selectedFiles: IFile[] = [];
  public isShowAddFilesModal = false;
  public mailForm: FormGroup;
  public mailText = '';
  public isResetModal = false;
  public disabledButton = false;
  public messagesType = EMessageType;
  public nextStep: number;
  public TYPE_TRUDI = ETrudiType;
  private subscribers = new Subject<void>();
  private isNonAppUser = true;

  isSendEmail = false;
  public emailContent: string = '';

  constructor(
    private filesService: FilesService,
    private popupService: PopupService,
    public userService: UserService,
    private conversationService: ConversationService,
    private apiService: ApiService,
    private headerService: HeaderService,
    private sendMessageService: SendMessageService,
    private taskService: TaskService
  ) {
    this.mailForm = new FormGroup({
      mailContent: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.replaceVariable(this.trudiBody);
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.isNonAppUser =
          this.conversationService.getConversationType(
            res.status,
            res.inviteStatus
          ) === EConversationType.nonApp;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trudiBody']?.currentValue) {
      this.replaceVariable(this.trudiBody);
    }
  }

  handleOnClick(event: TrudiButton) {
    this.nextStep = event.nextStep;
    switch (event.action) {
      case ForwardButtonAction.editMessage:
        this.onEdit();
        break;
      case ForwardButtonAction.sendMessage:
        this.onSend();
        break;
    }
  }

  resetInputForSendMessage() {
    this.selectedFiles = [];
    this.isResetModal = true;
  }

  onEdit() {
    this.isShowSendMessageModal = true;
    this.isShowUserModal = true;
    this.resetInputForSendMessage();
  }

  onCancel() {
    this.disabledButton = false;
  }

  replaceVariable(trudiData: TrudiBody) {
    if (!trudiData || !trudiData.text || !trudiData.variable) {
      this.emailContent = null;
      return;
    }

    const consoleUserName = 'Trudi';
    const theirTitle = 'Virtual Property Assistant';

    this.mailText = trudiData.text;

    for (const [key, value] of Object.entries(trudiData.variable)) {
      if (this.mailText.includes(key)) {
        const reg = new RegExp(key, 'g');
        this.mailText = this.mailText.trim().replace(reg, value);
      }
    }

    this.mailText = this.mailText.replace(
      /{property manager name}/,
      consoleUserName + ', ' + theirTitle
    );
    this.emailContent = this.mailText;
  }

  onMoveToNextStep(nextStep: number) {
    this.moveNextStep.emit(nextStep);
  }

  onSend() {
    const body = {
      conversationId: this.conversationService.currentConversation.value.id,
      actionLinks: [],
      files: [],
      textMessage: {
        message: this.mailText.replace(/(<([^>]+)>)/gi, ''),
        isSendFromEmail: this.isNonAppUser,
        userId: trudiUserId
      },
      isResolveConversation: true
    };

    this.sendMessageService
      .sendV2Message(body)
      .pipe(
        takeUntil(this.subscribers),
        tap(() => {
          this.headerService.moveCurrentTaskToInprogress();
        })
      )
      .subscribe((res: IMessage[]) => {
        this.conversationService.reloadConversationList.next(true);
        this.conversationService.messagesSentViaEmail.next(res);
        this.conversationService.currentUserChangeConversationStatus(
          this.messagesType.solved,
          false
        );
        const Q_A_STEP_0 = 0;
        this.conversationService
          .completedTrudiResponseStep(
            this.conversationService.trudiResponseConversation.getValue().id,
            Q_A_STEP_0
          )
          .pipe(takeUntil(this.subscribers))
          .subscribe(
            (res) => this.nextStep && this.moveNextStep.emit(this.nextStep)
          );
        this.markResolvedConversation(body.textMessage.userId);
      });
  }

  showSuccessMessageModal(status) {
    if (status) {
      this.userService.getUserInfo();
      this.isShowSendMessageModal = true;
      this.isResetModal = true;
    } else {
      this.isShowSendMessageModal = false;
      setTimeout(() => {
        this.resetSelectedDocument();
      }, 3000);
    }
  }

  resetSelectedDocument() {}

  closeModal(e) {
    this.resetInputForSendMessage();
    this.isShowSendMessageModal = false;
  }

  showAddFiles(status: boolean) {
    if (status) {
      this.isResetModal = false;
      this.isShowAddFilesModal = true;
      this.popupService.isShowAddFilesModal.next(true);
      this.isShowSendMessageModal = false;
      this.isShowQuitConfirm = false;
    } else {
      this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
    }
  }

  showAppSendMessage(status: PopupState) {
    if (status.display) {
      this.isShowSendMessageModal = true;
      this.isResetModal = false;
      this.isShowQuitConfirm = false;
      this.isShowAddFilesModal = false;
    } else {
      this.resetInputForSendMessage();
      this.isShowSendMessageModal = false;
    }
  }

  getSelectedFile(event) {
    if (!this.selectedFiles.includes(event)) {
      this.selectedFiles.push(event);
    }
  }

  markResolvedConversation(userId: string) {
    const currentUser = this.userService.userInfo$.getValue();
    let user: LastUser = null;
    if (userId === trudiUserId) {
      user = {
        firstName: 'Trudi',
        status: 'status',
        isUserPropetyTree: false,
        lastName: '',
        avatar: 'assets/icon/trudi-logo.svg',
        id: trudiUserId,
        type: 'trudi'
      };
    } else if (userId === currentUser.id) {
      user = {
        firstName: currentUser.firstName,
        status: currentUser.status,
        isUserPropetyTree: currentUser.userProperties?.idUserPropetyTree,
        lastName: currentUser.lastName,
        avatar: currentUser.googleAvatar,
        id: currentUser.id,
        type: currentUser.type
      };
    }
    this.conversationService.updateConversationStatus$.next({
      status: EMessageType.solved,
      option: null,
      user,
      addMessageToHistory: false
    });
  }

  showQuitConfirm(status: boolean) {
    if (status) {
      this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
      this.isShowQuitConfirm = true;
    } else {
      this.isShowQuitConfirm = false;
      this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
      this.isShowSuccessInviteModal = false;
      this.resetInputForSendMessage();
    }
  }

  get getMailContent() {
    return this.mailForm.get('mailContent');
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }
}

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { TrudiButton, TrudiResponse } from '@shared/types/trudi.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { IFile } from '@shared/types/file.interface';
import { FormControl, FormGroup } from '@angular/forms';
import { EMessageType } from '@shared/enum/messageType.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { Subject } from 'rxjs';
import { FilesService } from '@services/files.service';
import { PopupService, PopupState } from '@services/popup.service';
import { UserService } from '@services/user.service';
import { ConversationService } from '@services/conversation.service';
import { ApiService } from '@services/api.service';
import { takeUntil } from 'rxjs/operators';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { SEND_MESSAGE_POPUP_OPEN_FROM, trudiUserId } from '@services/constants';
import { IMessage } from '@shared/types/message.interface';
import { LastUser } from '@shared/types/conversation.interface';
import { TrudiSuggestion } from '@shared/types/trudi-suggestion.interface';
import { AgencyService } from '@services/agency.service';
import { SharedService } from '@services/shared.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { HeaderService } from '@services/header.service';
import { replaceAll } from '@shared/feature/function.feature';
import { TaskService } from '@services/task.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { SendMessageService } from '@services/send-message.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'box-trudi-suggestion',
  templateUrl: './box-trudi-suggestion.component.html',
  styleUrls: ['./box-trudi-suggestion.component.scss']
})
export class BoxTrudiSuggestionComponent implements OnInit {
  @Input() trudiBody: TrudiSuggestion;
  @Input() unableResolve: boolean;
  @Output() moveNextStep = new EventEmitter<number>();
  @Output() completeStep = new EventEmitter<TrudiResponse>();

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
    private agencyService: AgencyService,
    private sharedService: SharedService,
    private headerService: HeaderService,
    private taskService: TaskService,
    private sendMessageService: SendMessageService,
    private companySignature: CompanyEmailSignatureService,
    private companyService: CompanyService
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

  replaceVariable(trudiData: TrudiSuggestion) {
    if (!trudiData.data[0].body.text) {
      this.emailContent = null;
      return;
    }
    const { firstName, lastName } =
      this.conversationService.currentConversation.value;
    const companyId = this.companyService.currentCompanyId();
    const companies = this.companyService.getCompaniesValue();
    const currentCompany = companies.find((item) => item.id === companyId);
    this.mailText = trudiData.data[0].body.text;
    this.mailText = replaceAll(this.mailText, /\t/, '');
    this.mailText = this.mailText.replace(
      /{receiver_name}/,
      this.sharedService.displayName(firstName, lastName)
    );
    this.mailText = this.mailText.replace(
      /{name}/,
      this.sharedService.displayName(firstName, lastName)
    );
    this.mailText = this.mailText.replace(
      /{agency_name}/,
      currentCompany?.name
    );
    this.mailText = this.mailText.replace(
      /{property_manager}/,
      `Trudi, Virtual Property Assistant\n${currentCompany?.name}`
    );
    this.emailContent = this.mailText;
  }

  handleRemoveFileItem(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  onMoveToNextStep(nextStep: number) {
    this.moveNextStep.emit(nextStep);
  }

  onSend() {
    const text = this.mailText;
    let signatureHtml =
      this.isNonAppUser && this.companySignature.signatureContent.value
        ? '<br/><div id="email-signature">' +
          this.companySignature.signatureContent.value +
          '</div>'
        : '';
    const body = {
      conversationId: this.conversationService.currentConversation.value.id,
      actionLinks: [],
      files: [],
      textMessage: {
        message:
          '<p>' +
          text.replace(/(<([^>]+)>)/gi, '').replace(/\n/g, '<br/>') +
          '</p>' +
          signatureHtml,
        isSendFromEmail: this.isNonAppUser,
        userId: trudiUserId
      },
      isResolveConversation: !this.unableResolve
    };

    this.sendMessageService
      .sendV2Message(body)
      .pipe(takeUntil(this.subscribers))
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
          .subscribe((res) => {
            if (res) {
              this.completeStep.next(res);
              if (!this.unableResolve) {
                this.headerService.headerState$.next({
                  ...this.headerService.headerState$.value,
                  currentStatus: TaskStatusType.completed
                });
              }
            }
          });
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

import {
  AppComposeMessageComponent,
  ComposeEditorType
} from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { ConversationService } from '@services/conversation.service';
import {
  SendOption,
  TinyEditorComponent,
  TinyEditorOpenFrom
} from '@shared/components/tiny-editor/tiny-editor.component';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  Host,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { EDeleteInLineType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import dayjs from 'dayjs';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ESendMsgAction } from '@/app/breach-notice/utils/breach-notice.enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ModalPopupPosition } from '@/app/shared/components/modal-popup/modal-popup';

@Component({
  selector: 'inline-message-editor',
  templateUrl: './inline-message-editor.component.html',
  styleUrls: ['./inline-message-editor.component.scss']
})
export class InlineMessageEditorComponent
  implements OnInit, OnDestroy, OnChanges
{
  readonly ComposeEditorType = ComposeEditorType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public TinyEditorOpenFrom = TinyEditorOpenFrom;
  public isSubmitted: boolean;
  public ModalPopupPosition = ModalPopupPosition;
  private unsubscribe = new Subject<void>();
  private triggerTypingSubject = new Subject<boolean>();
  private selectedUser: CurrentUser;
  private currentConversation: UserConversation;
  @ViewChild('editorContainer', { static: false })
  tinyEditorComponent: TinyEditorComponent;
  @Input() sendOptionsToRemove: SendOption[] = [];
  @Input() isDisableSendBtn = false;
  @Input() configs;
  @Input() prefillText = '';
  @Input() composeType;
  @Input() listDynamicParams = [];
  @Input() currentProperty;
  @Output() submitToSendMsg = new EventEmitter<{ action: string }>();
  attachmentTextEditorConfigs = {
    'header.title': 'Add contact card'
  };
  @Input() deleteInlineType: EDeleteInLineType;
  @Output() onChangeSendOption = new EventEmitter<SendOption>();
  @Input() errorMsg: boolean = false;
  @Output() contentHeightChange = new EventEmitter<number>(null);
  @Input() timeSecond: number;
  @Input() date: number;
  defaultBtnOption: EDefaultBtnDropdownOptions =
    EDefaultBtnDropdownOptions.Send;
  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private elementRef: ElementRef,
    private uploadFromCRMService: UploadFromCRMService,
    @Host() private appComposeMessage: AppComposeMessageComponent,
    private conversationService: ConversationService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        this.selectedUser = user;
      });
    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversation) => {
        this.currentConversation = conversation;
      });
    this.subscribeTriggerTyping();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']?.currentValue) {
      this.defaultBtnOption =
        this.configs.body.typeSendMsg === ESendMsgAction.Schedule
          ? EDefaultBtnDropdownOptions.Schedule
          : this.configs.body.typeSendMsg === ESendMsgAction.SendAndResolve
          ? EDefaultBtnDropdownOptions.SendAndResolve
          : EDefaultBtnDropdownOptions.Send;
    }
  }

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get msgContent() {
    return this.sendMsgForm.get('msgContent');
  }

  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get listOfFilesControl(): AbstractControl {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  get selectedReceivers() {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get selectedContactCard() {
    return this.trudiAddContactCardService.getSelectedContactCard();
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  handleValueChange(value: string) {
    this.msgContent.setValue(value);
    if (!value) {
      this.triggerTypingSubject.next(false);
      return;
    }
    this.triggerTypingSubject.next(true);
  }

  handleSubmit(data) {
    this.submitToSendMsg.emit({
      ...data,
      action: data.typeBtn
    });
  }

  editorAddFileComputer() {
    const button =
      this.appComposeMessage.elementRef?.nativeElement?.querySelector(
        '#trudi-send-msg-upload-btn'
      ) as HTMLElement;
    button?.click();
  }

  onCloseAddContactCard() {
    this.trudiAddContactCardService.setPopupState({
      addContactCard: false
    });
  }

  editorAddContactCard() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.trudiAddContactCardService.setPopupState({
      addContactCard: true
    });
  }

  editorAddFileFromCrm() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: true
    });
  }

  addReiForm() {
    this.trudiSendMsgService.setPopupState({
      addReiFormOutside: true,
      selectDocument: true,
      sendMessage: false
    });
  }

  onTriggerAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCard) {
      if (this.selectedContactCard)
        this.trudiSendMsgFormService.setSelectedContactCard([
          ...this.selectedContactCard
        ]);
      this.trudiAddContactCardService.setPopupState({
        addContactCard: false
      });
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
    }
  }

  onTriggerAddFilesFromCrm() {
    if (this.uploadFileFromCRMPopupState.uploadFileFromCRM) {
      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRM: false
      });
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
      if (this.selectedFilesFromCMS)
        this.listOfFilesControl.setValue([
          ...this.listOfFilesControl.value,
          ...this.selectedFilesFromCMS
        ]);
    }
  }

  onCloseUploadFromCRM() {
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: false
    });
  }

  handleChangeSendOption(option: SendOption) {
    this.onChangeSendOption.emit(option);
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }

  get contactCardPopupState() {
    return this.trudiAddContactCardService.getPopupState();
  }

  private subscribeTriggerTyping() {
    this.triggerTypingSubject
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((status) => {
        this.sendTypingSocket(status);
      });
  }

  sendTypingSocket(status = true) {
    if (
      this.currentConversation &&
      this.conversationService.isTrudiControlConversation(
        this.currentConversation
      )
    ) {
      return;
    }
    if (!this.selectedUser) return;
    const currentUserId = this.selectedUser.id;
    const user = this.selectedUser;
    const body = {
      propertyId: this.currentProperty?.id,
      createdAt: dayjs().format(),
      type: 'SEND',
      sendType: `typing ${status ? 'on' : 'off'}`,
      userType: user.type,
      firstName: user.firstName,
      lastName: user.lastName,
      googleAvatar: user.googleAvatar
    };
    this.conversationService
      .sendTyingSocketByCallingAPI(
        this.currentConversation?.id,
        currentUserId,
        body
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  onBlur() {
    if (this.msgContent && this.msgContent.value.length) {
      this.sendTypingSocket(false);
    }
  }

  onFocus(e) {
    if (e && this.msgContent.value.length) {
      this.sendTypingSocket();
    }
  }

  handleContentHeightChange($event: number) {
    this.contentHeightChange.emit($event);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

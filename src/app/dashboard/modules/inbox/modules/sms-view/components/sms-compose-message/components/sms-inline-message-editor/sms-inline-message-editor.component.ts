import { ComposeEditorType } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
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
import { Subject } from 'rxjs';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ESendMsgAction } from '@/app/breach-notice/utils/breach-notice.enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { SmsComposeMessageComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-compose-message/sms-compose-message.component';
import { ModalPopupPosition } from '@/app/shared';

@Component({
  selector: 'sms-inline-message-editor',
  templateUrl: './sms-inline-message-editor.component.html',
  styleUrl: './sms-inline-message-editor.component.scss'
})
export class SmsInlineMessageEditorComponent
  implements OnInit, OnDestroy, OnChanges
{
  readonly ComposeEditorType = ComposeEditorType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public TinyEditorOpenFrom = TinyEditorOpenFrom;
  public isSubmitted: boolean;
  public ModalPopupPosition = ModalPopupPosition;
  private unsubscribe = new Subject<void>();
  private triggerTypingSubject = new Subject<boolean>();
  @ViewChild('editorContainer', { static: false })
  tinyEditorComponent: TinyEditorComponent;
  @Input() isDisableSendBtn = false;
  @Input() configs;
  @Input() prefillText = '';
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

  isShowConfirmModal = false;

  sendAndResolveMessage;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private elementRef: ElementRef,
    private uploadFromCRMService: UploadFromCRMService,
    @Host() private composeMessage: SmsComposeMessageComponent,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']?.currentValue) {
      this.defaultBtnOption =
        this.configs.body.typeSendMsg === ESendMsgAction.SendAndResolve
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
    const sendMessage = {
      ...data,
      action: data.typeBtn
    };
    if (data.typeBtn === SendOption.SendResolve) {
      this.isShowConfirmModal = true;
      this.sendAndResolveMessage = sendMessage;
    } else {
      this.submitToSendMsg.emit(sendMessage);
    }
  }

  editorAddFileComputer() {
    const button = this.composeMessage.elementRef?.nativeElement?.querySelector(
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
      this.trudiAddContactCardService.setPopupState({
        addContactCard: false
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

  handleContentHeightChange($event: number) {
    this.contentHeightChange.emit($event);
  }

  handleVisibleChange(isShowConfirmModal) {
    this.isShowConfirmModal = isShowConfirmModal;
  }

  handleSendAndResolveMessage() {
    this.submitToSendMsg.emit(this.sendAndResolveMessage);
    this.isShowConfirmModal = false;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

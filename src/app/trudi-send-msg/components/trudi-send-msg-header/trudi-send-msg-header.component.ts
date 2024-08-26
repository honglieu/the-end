import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { AbstractControl, FormGroup } from '@angular/forms';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Subject, startWith, takeUntil } from 'rxjs';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'trudi-send-msg-header',
  templateUrl: './trudi-send-msg-header.component.html',
  styleUrls: ['./trudi-send-msg-header.component.scss']
})
export class TrudiSendMsgHeaderComponent implements OnInit, OnDestroy {
  @Input() configs: ISendMsgConfigs;
  @Input() expandable: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() isAppUser: boolean = false;
  @Input() isFullScreenModal: boolean = false;
  @Input() listProperties: UserPropertyInPeople[] = [];
  @Output() closeSendMsg = new EventEmitter();
  @Output() triggerOpenViewRecipients = new EventEmitter();
  @Output() triggerExpandOrResizeModal = new EventEmitter();
  private unsubscribe = new Subject<void>();
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public invalidRecipients: boolean = false;
  public isTaskStepSingleEmailSendType = false;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService
  ) {}

  ngOnInit(): void {
    const typeSend =
      (this.configs?.trudiButton as TrudiStep)?.fields.typeSend ||
      this.configs?.inputs?.prefillData?.fields?.typeSend;
    this.isTaskStepSingleEmailSendType = typeSend === ETypeSend.SINGLE_EMAIL;
    // change modal header text based on selected receivers
    if (this.configs.header.isChangeHeaderText) {
      this.handleChangeHeaderText();
    }
  }

  handleChangeHeaderText() {
    let totalMessages = 0;
    this.selectedReceivers.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        startWith(this.selectedReceivers.value)
      )
      .subscribe((formValue) => {
        // selected receivers store in 2 types of form:
        // 1. 'Contact type'
        // 2. 'Individual contact'
        if (formValue?.length > 0) {
          //  if form has property 'data' (Contact type)=> flatten the list then get the length
          //  if form is individual contact then just need to get the length
          if (formValue[0].hasOwnProperty('data')) {
            totalMessages = formValue.map((item) => item.data).flat().length;
          } else {
            totalMessages = formValue.length;
          }
        } else {
          totalMessages = 0;
        }

        this.invalidRecipients = false;
        switch (totalMessages) {
          case 0:
            this.invalidRecipients = true;
            this.configs.header.title = 'Send bulk message';
            break;
          case 1:
            this.configs.header.title = 'Bulk send 1 message';
            break;
          default:
            this.configs.header.title = `Bulk send ${totalMessages} messages`;
        }
      });
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  handleClickViewRecipientsBtn() {
    this.triggerOpenViewRecipients.emit();
    this.trudiSendMsgService.setPopupState({
      sendMessage: false,
      viewRecipients: true
    });
  }

  onCloseSendMsg() {
    this.closeSendMsg.emit();
  }

  onTriggerExpandOrResizeModal() {
    this.triggerExpandOrResizeModal.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

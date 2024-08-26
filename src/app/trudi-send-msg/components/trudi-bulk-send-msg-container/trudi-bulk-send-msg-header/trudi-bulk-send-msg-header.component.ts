import {
  Component,
  ContentChild,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';

import { AbstractControl, FormGroup } from '@angular/forms';
import { Subject, startWith, takeUntil } from 'rxjs';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { EDataE2ESend } from '@shared/enum/E2E.enum';
import { IconType } from '@trudi-ui';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'trudi-bulk-send-msg-header',
  templateUrl: './trudi-bulk-send-msg-header.component.html',
  styleUrls: ['./trudi-bulk-send-msg-header.component.scss']
})
export class TrudiBulkSendMsgHeaderComponent implements OnInit, OnDestroy {
  @Input() configs: ISendMsgConfigs;
  @Input() isAppUser: boolean = false;
  @ContentChild('sendActionTpl') sendActionTpl;

  @HostBinding('attr.class') get classes() {
    return 'd-block w-100';
  }

  public fromAppChat: boolean = false;
  public showListSendOption = false;
  public sendOptionValue: Array<{
    icon: keyof typeof IconType;
    text: SendOption;
    dataE2e: EDataE2ESend;
  }> = [
    {
      icon: 'timeIcon',
      text: SendOption.ScheduleForSend,
      dataE2e: EDataE2ESend.SEND_AND_RESCHEDULE
    },
    {
      icon: 'completeIconOutline',
      text: SendOption.SendResolve,
      dataE2e: EDataE2ESend.SEND_AND_RESOLVE
    },
    {
      icon: 'sendArrowBlank',
      text: SendOption.Send,
      dataE2e: EDataE2ESend.SEND
    }
  ];
  public selectedSendOption =
    this.sendOptionValue[this.sendOptionValue.length - 1];

  public isShowBackBtn = false;
  private unsubscribe = new Subject<void>();
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public invalidRecipients: boolean = false;
  private selectedRecipients: ISelectedReceivers[] = [];

  constructor(private trudiSendMsgFormService: TrudiSendMsgFormService) {}

  ngOnInit(): void {
    // change modal header text based on selected receivers
    if (this.configs.header.isChangeHeaderText) {
      this.selectedReceiversControl.valueChanges
        .pipe(
          takeUntil(this.unsubscribe),
          startWith(this.selectedReceiversControl.value)
        )
        .subscribe((formValue) => {
          this.selectedRecipients = formValue || [];
          this.headerTextChange();
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']) {
      this.headerTextChange();
    }
  }

  headerTextChange() {
    let totalEmails = this.selectedRecipients.length;
    const typeSend =
      (this.configs.trudiButton as TrudiStep)?.fields.typeSend ||
      this.configs.inputs.prefillData?.fields?.typeSend;
    if (
      this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS &&
      typeSend === ETypeSend.SINGLE_EMAIL
    ) {
      totalEmails = new Set(this.selectedRecipients.map((it) => it.taskId))
        .size;
    }
    this.invalidRecipients = false;
    switch (totalEmails) {
      case 0:
        this.invalidRecipients = true;
        this.configs.header.title = 'Bulk send 0 emails';
        break;
      case 1:
        this.configs.header.title = 'Bulk send 1 email';
        break;
      default:
        this.configs.header.title = `Bulk send ${totalEmails} emails`;
    }
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  get selectedReceiversControl(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

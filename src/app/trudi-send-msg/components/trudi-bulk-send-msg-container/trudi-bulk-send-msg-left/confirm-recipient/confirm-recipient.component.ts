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
  IConfirmRecipientContactGroupData,
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AbstractControl, FormGroup } from '@angular/forms';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { cloneDeep, flatMap } from 'lodash-es';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { Subject, takeUntil } from 'rxjs';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { EConfirmContactType } from '@shared/enum';
import { TrudiSelectReceiverV2Component } from '@/app/trudi-send-msg/components/trudi-select-receiver-v2/trudi-select-receiver-v2.component';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskItem } from '@shared/types/task.interface';
import { TrudiConfirmRecipientService } from '@/app/trudi-send-msg/services/trudi-confirm-recipients.service';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

export interface IDisplayRecipient extends ISelectedReceivers {
  isFromSelectRecipients?: boolean;
}

export interface IDisplayRecipientGroupByTask {
  id: string;
  title: string;
  streetline: string;
  recipients: IDisplayRecipient[];
}

@Component({
  selector: 'confirm-recipient',
  templateUrl: './confirm-recipient.component.html',
  styleUrls: ['./confirm-recipient.component.scss']
})
export class ConfirmRecipientComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(TrudiSelectReceiverV2Component)
  trudiSelectReceiverV2Component: TrudiSelectReceiverV2Component;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() isRmEnvironment: boolean = false;
  @Input() selectedTasks: ITasksForPrefillDynamicData[] | TaskItem[] = [];
  @Input() isSubmitted = false;
  @Output() confirm = new EventEmitter<ISelectedReceivers[]>();
  @Output() triggerClose = new EventEmitter();
  @Output() editConfirmRecipient = new EventEmitter();
  private destroyed$ = new Subject<void>();
  public listReceiversContactGroup: ISelectedReceivers[];
  public displayRecipients: IDisplayRecipient[] = [];
  public recipientGroupByTask: IDisplayRecipientGroupByTask[] = [];
  public readonly ECreateMessageFrom = ECreateMessageFrom;
  public readonly EConfirmContactType = EConfirmContactType;
  public isSendSingleEmail: boolean = false;
  public isHasRecipientEdit = false;
  public toReceivers = [];
  public selectedProperty: UserPropertyInPeople = null;
  public readonly mapConfirmRecipientsFn = (
    item: IConfirmRecipientContactGroupData,
    _: number,
    items: IConfirmRecipientContactGroupData[]
  ) => {
    const displayIndex = items
      .filter((it) => Boolean(it.recipients?.length))
      .findIndex((it) => it.taskId === item.taskId);
    return {
      ...item,
      displayIndex
    };
  };

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get ccReceivers() {
    return this.sendMsgForm.get('ccReceivers');
  }

  get bccReceivers() {
    return this.sendMsgForm.get('bccReceivers');
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get isOpenFromBulkCreateTask(): boolean {
    return this.configs?.otherConfigs.openFromBulkCreateTask;
  }

  get isTaskLoading$() {
    return this.trudiConfirmRecipientService.isTaskLoading$;
  }

  get isContactLoading$() {
    return this.trudiConfirmRecipientService.isContactLoading$;
  }

  get listContactGroup() {
    return this.trudiConfirmRecipientService.listContactGroup;
  }

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private trudiConfirmRecipientService: TrudiConfirmRecipientService
  ) {}

  ngOnInit(): void {
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_STEP
    ) {
      const { propertyId } = this.trudiSendMsgService.getIDsFromOtherService();
      this.selectedProperty = { id: propertyId } as UserPropertyInPeople;
    }

    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.MULTI_MESSAGES
    ) {
      this.displayRecipients = [...this.selectedReceivers.value];
    }

    this.listContactGroup?.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((rs: IConfirmRecipientContactGroupData[]) => {
        const listReceiver = rs.flatMap((group, index) =>
          group.recipients.map((recipient) => ({
            ...recipient,
            taskId: group.taskId,
            // propertyId in case bulk create tasks is not correct
            // to insert dynamic correctly -> use actualPropertyId
            propertyId: group.propertyId,
            actualPropertyId: recipient.propertyId,
            streetLine:
              recipient.streetLine ||
              this.recipientGroupByTask?.[index]?.streetline ||
              group.streetLine
          }))
        );
        this.listReceiversContactGroup = flatMap(
          this.listContactGroup?.controls?.map(
            (item) => item?.value?.recipients
          )
        );
        this.toReceivers = Array.from(
          new Set(listReceiver?.map((item) => item?.group || item?.email))
        );
        this.selectedReceivers.setValue(listReceiver);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTasks']?.currentValue) {
      this.recipientGroupByTask =
        this.selectedTasks.map((task) => {
          return {
            id: task.taskId,
            title: task.taskTitle,
            streetline: task.property?.streetLine || task.streetline,
            propertyId: task.property?.id,
            recipients: []
          };
        }) || [];
    }

    if (changes['configs'] && changes['configs'].currentValue) {
      const typeSend =
        (this.configs.trudiButton as TrudiStep)?.fields.typeSend ||
        this.configs.inputs.prefillData?.fields?.typeSend;
      this.isSendSingleEmail = typeSend === ETypeSend.SINGLE_EMAIL;

      const { createMessageFrom } = this.configs.otherConfigs;
      this.isHasRecipientEdit = ![
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.CONTACT
      ].includes(createMessageFrom);
    }
  }

  handleRemoveContact(
    recipient,
    formControl: AbstractControl,
    contactIndex: number
  ) {
    this.trackUserChangeValue();
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.MULTI_MESSAGES
    ) {
      this.displayRecipients = this.displayRecipients.filter(
        (item) => recipient.conversationId !== item.conversationId
      );
      this.selectedReceivers.setValue(this.displayRecipients);
    } else {
      if (this.isSendSingleEmail) {
        const clearTaskId = recipient?.[0]?.taskId;
        const formGroupData = this.listContactGroup.value || [];
        const clearControlIndex = formGroupData.findIndex((item) => {
          return item.taskId === clearTaskId;
        });
        this.listContactGroup.controls[clearControlIndex]
          .get('recipients')
          .setValue([]);
      } else {
        const newRecipients = (formControl.value as unknown[]) || [];
        newRecipients.splice(contactIndex, 1);
        formControl.setValue([...newRecipients]);
      }
      this.trudiConfirmRecipientService.triggerRemoveConfirmRecipient$.next(
        recipient
      );
    }
  }

  trackBy(_, item) {
    return item.id;
  }

  trackByListContactGroup(_, item) {
    return item.taskId;
  }

  trackUserChangeValue() {
    this.trudiSaveDraftService.setTrackControlChange('selectedReceivers', true);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

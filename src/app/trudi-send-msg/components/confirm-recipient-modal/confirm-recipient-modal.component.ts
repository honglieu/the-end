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
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { TrudiConfirmRecipientService } from '@/app/trudi-send-msg/services/trudi-confirm-recipients.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { Subject, map, takeUntil, tap } from 'rxjs';
import {
  getUniqConfirmRecipients,
  SendEmailToService,
  SUFFIX_INVALID_EMAIL_ID
} from './send-email-to.service';
import { UserService } from '@services/user.service';
import { EMAIL_PATTERN } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  MAP_TYPE_RECEIVER_TO_LABEL,
  MAP_TYPE_RECEIVER_TO_SUBLABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
@Component({
  selector: 'confirm-recipient-modal',
  templateUrl: './confirm-recipient-modal.component.html',
  styleUrl: './confirm-recipient-modal.component.scss',
  providers: [SendEmailToService]
})
export class ConfirmRecipientsModalComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() visible = false;
  @Input() title = 'Confirm recipients';
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isSubmitted = false;
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = [];
  @Input() hasBackBtn = false;
  @Output() cancel = new EventEmitter();
  @Output() back = new EventEmitter();
  @Output() next = new EventEmitter();

  @ViewChild('selectContainer') selectContactType;

  public formGroup = new FormGroup({
    toReceivers: new FormControl(
      [],
      [Validators.required, this.receiversValidator()]
    ),
    ccReceivers: new FormControl([], [this.receiversValidator()]),
    bccReceivers: new FormControl([], [this.receiversValidator()])
  });

  toPlaceholder: string;
  ccBccPlaceholder: string;
  public currentStepControl = new FormControl<ICommunicationStep>(null, [
    Validators.required
  ]);

  public listContactTypes = [];
  public items = [];
  public hasTaskStep = false;
  public isContactType = true;
  readonly EUserPropertyType = EUserPropertyType;
  public ETypeSend = ETypeSend;
  public ECreateMessageFrom = ECreateMessageFrom;
  public typeMethodSendEmail: ETypeSend = ETypeSend.BULK_EMAIL;
  private destroy$ = new Subject<void>();
  public isFormSubmitted: boolean = false;
  public selectedProperties = [];

  constructor(
    private trudiConfirmRecipientService: TrudiConfirmRecipientService,
    private sendEmailToService: SendEmailToService,
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgUserService: TrudiSendMsgUserService
  ) {}
  private previousValue = {
    toReceivers: [],
    ccReceivers: [],
    bccReceivers: [],
    step: null
  };

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sendMsgCcReceivers() {
    return this.sendMsgForm.get('ccReceivers');
  }

  get sendMsgBccReceivers() {
    return this.sendMsgForm.get('bccReceivers');
  }

  get toReceivers() {
    return this.formGroup.get('toReceivers');
  }

  get ccReceivers() {
    return this.formGroup.get('ccReceivers');
  }

  get bccReceivers() {
    return this.formGroup.get('bccReceivers');
  }

  get selectedProperty(): AbstractControl {
    return this.sendMsgForm.get('property');
  }

  receiversValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const controlValue = control?.value;

      if (!controlValue.length) return null;

      const isInvalid = controlValue.some((value) =>
        typeof value === 'string'
          ? value.endsWith(SUFFIX_INVALID_EMAIL_ID)
          : value.isInvalid
      );

      if (isInvalid) {
        return { emailInvalid: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.isContactType =
      this.configs.otherConfigs.createMessageFrom !==
      ECreateMessageFrom.TASK_STEP;
    this.typeMethodSendEmail =
      this.configs.inputs.prefillData?.fields?.typeSend ||
      (this.configs.trudiButton as TrudiStep)?.fields?.typeSend ||
      ETypeSend.BULK_EMAIL;

    this.hasTaskStep =
      this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS &&
      this.configs.otherConfigs.openFromBulkCreateTask;

    this.title = this.hasTaskStep
      ? 'Select task step'
      : this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS
      ? 'Confirm recipients for bulk-email'
      : 'Confirm recipients';
    this.configs.otherConfigs['isShowGreetingSendBulkContent'] =
      this.shouldShowGreetingSendBulkContent();
    if (
      this.hasTaskStep ||
      (!this.hasTaskStep &&
        this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.MULTI_TASKS)
    ) {
      this.toPlaceholder = 'Select contact type or add external email';
      this.ccBccPlaceholder =
        'Select supplier, other contact or add external email';
    } else {
      this.toPlaceholder = 'Search name, email or property address';
      this.ccBccPlaceholder = 'Search name, email or property address';
    }

    this.getContactTypeListApi()
      .pipe(takeUntil(this.destroy$))
      .subscribe((listContactTypes) => {
        //prefill: task step
        if (listContactTypes) {
          this.handlePrefill();
        }
      });

    // binding value between confirm recipients modal and bulk send message modal
    this.trudiConfirmRecipientService.triggerRemoveConfirmRecipient$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!this.isContactType) {
          const removeItem = res as ISelectedReceivers;
          const isRemoveExternalEmail =
            removeItem.type === EUserPropertyType.UNIDENTIFIED;
          this.toReceivers.setValue(
            this.toReceivers.value.filter((receiver) =>
              isRemoveExternalEmail
                ? !(receiver.email === removeItem.email)
                : !(
                    receiver.id === removeItem.id &&
                    receiver.propertyId === removeItem.propertyId &&
                    (receiver.secondaryEmail?.id ===
                      removeItem.secondaryEmail?.id ||
                      receiver.secondaryEmail?.email ===
                        removeItem.secondaryEmail?.email)
                  )
            )
          );
        } else {
          let toReceiverItemIds = [];
          if (this.typeMethodSendEmail === ETypeSend.SINGLE_EMAIL) {
            const removeItems = res as ISelectedReceivers[];
            removeItems.forEach((removeItem) => {
              toReceiverItemIds = [
                ...toReceiverItemIds,
                ...this.sendEmailToService.getBulkSendToItemsByRecipient(
                  removeItem
                )
              ];
            });
            toReceiverItemIds = Array.from(new Set(toReceiverItemIds));
          } else {
            const removeItem = res as ISelectedReceivers;
            toReceiverItemIds =
              this.sendEmailToService.getBulkSendToItemsByRecipient(removeItem);
          }
          this.toReceivers.setValue(
            this.toReceivers.value.filter(
              (item) =>
                !toReceiverItemIds.some(
                  (toReceiverItemId) => toReceiverItemId == item
                )
            )
          );
        }
        const allRecipientsRemoved =
          this.trudiConfirmRecipientService.listContactGroup.value.every(
            (item) => !item.recipients?.length
          );
        if (allRecipientsRemoved) {
          this.ccReceivers.setValue([]);
          this.bccReceivers.setValue([]);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTasks']) {
      this.selectedProperties = this.selectedTasks.map((item) => item.property);
    }

    if (changes['visible']) {
      if (changes['visible'].currentValue) {
        this.formGroup?.markAsUntouched();
        this.currentStepControl.markAsUntouched();
        this.formGroup?.markAsPristine();
        this.previousValue.step = this.currentStepControl.value;
        this.previousValue.toReceivers = this.toReceivers.value;
        this.previousValue.bccReceivers = this.bccReceivers?.value;
        this.previousValue.ccReceivers = this.ccReceivers?.value;
        this.setDefaultSelectContainerPreview();
      } else {
        this.isFormSubmitted = false;
      }
    }
  }

  private getContactTypeListApi() {
    let body = {
      taskIds: (this.configs?.inputs?.selectedTasksForPrefill || []).map(
        (data) => data.taskId
      )
    };
    return this.trudiSendMsgUserService.getListContactTypeApi(body).pipe(
      takeUntil(this.destroy$),
      map((res) => {
        // TODO: move to api function
        return res.map((item, index) => ({
          ...item,
          label: MAP_TYPE_RECEIVER_TO_LABEL[item.type],
          subLabel: MAP_TYPE_RECEIVER_TO_SUBLABEL[item.type] ?? '',
          disabled: !item?.data || item.data?.length === 0,
          id: item.type,
          data:
            (item.data || []).map((receiver) => {
              if (
                receiver?.type === EUserPropertyType.TENANT ||
                receiver?.type === EUserPropertyType.LANDLORD ||
                receiver?.type === EUserPropertyType.TENANT_UNIT ||
                receiver?.type === EUserPropertyType.TENANT_PROPERTY
              ) {
                receiver.isAppUser =
                  this.userService.getStatusInvite(
                    receiver?.iviteSent,
                    receiver?.lastActivity,
                    receiver?.offBoardedDate,
                    receiver?.trudiUserId
                  ) === EUserInviteStatusType.active;
              }
              return receiver;
            }) ?? []
        }));
      }),
      tap((listContactTypes) => {
        this.listContactTypes = listContactTypes.map((item) => ({
          ...item,
          isValid: true
        }));
        this.items = this.listContactTypes;
      })
    );
  }

  handlePrefill() {
    const { sendTo, sendBcc, sendCc } =
      this.configs.inputs.prefillData?.fields ||
      (this.configs.trudiButton as TrudiStep)?.fields ||
      {};

    const externalEmailsData = this.getExternalEmail(sendTo || [], true);
    this.ccReceivers.setValue(
      sendCc?.map((cc) => ({ ...cc, isValid: cc.isValid ?? !cc.isInvalid })) ||
        []
    );
    this.bccReceivers.setValue(
      sendBcc?.map((bcc) => ({
        ...bcc,
        isValid: bcc.isValid ?? !bcc.isInvalid
      })) || []
    );

    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_STEP
    ) {
      //prefill confirm recipient modal when execute step
      //display receivers instead of contact type
      const receivers = this.convertContactTypeToReceivers(
        this.getPrefillContactTypeHasData(this.listContactTypes, sendTo)
      );

      this.toReceivers.setValue([
        ...receivers,
        ...externalEmailsData?.map((externalEmail) =>
          this.addEmail(externalEmail)
        )
      ]);
      //display confirm recipients in send msg modal incontinently
      this.handleConvertToConfirmRecipients();
    } else {
      //prefill when trigger task step
      //display contact type
      this.toReceivers.setValue([
        ...(this.getPrefillContactTypeHasData(
          this.listContactTypes,
          sendTo
        )?.map((item) => item.id) || []),
        ...externalEmailsData
      ]);
    }
  }

  getPrefillContactTypeHasData(contactTypes = [], contactTypePrefill = []) {
    return contactTypes.filter(
      (item) =>
        (contactTypePrefill?.includes(item.id) ||
          contactTypePrefill?.includes(item.type)) &&
        item.data?.length
    );
  }

  convertContactTypeToReceivers(contactTypes = []) {
    const recipients =
      contactTypes.flatMap((item) => {
        return item.data.filter(
          (recipient) => recipient.email || recipient.secondaryEmail?.email
        );
      }) || [];

    return getUniqConfirmRecipients(recipients);
  }

  //format email
  addEmail = (label) => {
    label = label.replaceAll(/\s/g, '').trim();
    const emailPattern = EMAIL_PATTERN;
    const isValid = emailPattern.test(label);
    const uniqId = isValid ? label : label + SUFFIX_INVALID_EMAIL_ID;
    return {
      id: uniqId,
      email: label,
      label,
      isValid,
      type: EUserPropertyType.UNIDENTIFIED,
      subLabel: null,
      data: isValid
        ? this.selectedTasks.map((task) => ({
            ...task,
            id: label,
            email: label,
            isValid,
            propertyId: task.property?.id,
            isFromSelectRecipients: true,
            type: EUserPropertyType.UNIDENTIFIED
          }))
        : []
    };
  };

  isExternalEmail(item, isContactType) {
    return isContactType
      ? EMAIL_PATTERN.test(item as string)
      : (item as ISelectedReceivers).type === EUserPropertyType.UNIDENTIFIED;
  }

  handleChangeStepTemplate(step?: ICommunicationStep) {
    this.currentStepControl.markAsUntouched();
    this.isFormSubmitted = false;

    const listDynamicFieldData = step?.dynamicFieldActions || [];
    const textForwardMsg = step?.fields?.msgBody || '';
    const filesAttach = step?.fields?.files || [];

    const newConfigs = {
      ...this.configs,
      body: {
        ...this.configs.body,
        prefillTitle: step?.fields?.msgTitle || '',
        actionId: step?.id
      },
      inputs: {
        ...this.configs.inputs,
        rawMsg: textForwardMsg,
        prefillData: step,
        listDynamicFieldData: listDynamicFieldData,
        listOfFiles: filesAttach
      }
    };

    this.configs = newConfigs as ISendMsgConfigs;

    this.typeMethodSendEmail = null;
    setTimeout(() => {
      this.typeMethodSendEmail = step?.fields?.typeSend;
    });

    this.handlePrefill();
  }

  getDataWithoutExternalEmail(data = [], isContactType = this.isContactType) {
    return data?.filter((e) => !this.isExternalEmail(e, isContactType));
  }

  getExternalEmail(data = [], isContactType = this.isContactType) {
    return (
      data?.filter((item) => this.isExternalEmail(item, isContactType)) || []
    );
  }

  handleConvertToConfirmRecipients() {
    this.sendEmailToService.initState(
      this.listContactTypes,
      this.selectedTasks
    );

    const confirmRecipients = this.sendEmailToService.generateConfirmRecipient(
      this.getDataWithoutExternalEmail(this.toReceivers.value),
      this.getExternalEmail(this.toReceivers.value)?.map((externalEmail) =>
        this.addEmail(this.isContactType ? externalEmail : externalEmail.email)
      ),
      this.isContactType
    );
    this.trudiConfirmRecipientService.contactFormArray.setValue(
      confirmRecipients
    );
    this.sendMsgCcReceivers.setValue(this.ccReceivers.value || []);
    this.sendMsgBccReceivers.setValue(this.bccReceivers.value || []);
  }

  setPreviousData() {
    this.currentStepControl.setValue(this.previousValue.step);
    this.toReceivers.setValue(this.previousValue.toReceivers, {
      emitEvent: false
    });
    this.ccReceivers.setValue(this.previousValue.ccReceivers, {
      emitEvent: false
    });
    this.bccReceivers.setValue(this.previousValue.bccReceivers, {
      emitEvent: false
    });
  }

  setDefaultSelectContainerPreview() {
    const properties = [
      'isShowPreview',
      'isShowPreviewTo',
      'isShowPreviewCcBcc'
    ];

    properties.forEach((prop) => {
      if (typeof this.selectContactType?.[prop] !== 'undefined') {
        this.selectContactType[prop] = true;
      }
    });
  }

  handleCancel() {
    this.cancel.emit();
  }

  handleBack() {
    this.back.emit();
    this.setPreviousData();
  }

  handleNext() {
    this.isFormSubmitted = true;
    this.formGroup.markAllAsTouched();
    this.currentStepControl.markAllAsTouched();
    this.formGroup.markAsDirty();
    if (this.formGroup.invalid) return;
    this.handleConvertToConfirmRecipients();
    if (this.hasTaskStep)
      this.trudiSendMsgService.triggerStepBulkSend(this.configs);
    this.next.emit();
  }

  private shouldShowGreetingSendBulkContent(): boolean {
    const { createMessageFrom } = this.configs.otherConfigs;
    if (
      [ECreateMessageFrom.CONTACT, ECreateMessageFrom.MULTI_MESSAGES].includes(
        createMessageFrom
      )
    ) {
      return true;
    }
    if (
      createMessageFrom === ECreateMessageFrom.MULTI_TASKS &&
      !this.configs.otherConfigs.openFromBulkCreateTask
    ) {
      return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

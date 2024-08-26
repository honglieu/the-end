import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, combineLatest, map, takeUntil, tap } from 'rxjs';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { UserService } from '@services/user.service';
import { EMAIL_PATTERN } from '@services/constants';
import {
  ConvertContactTypesToRecipientsService,
  SUFFIX_INVALID_EMAIL_ID
} from './bulk-send-to.service';
import { TrudiConfirmRecipientService } from '@/app/trudi-send-msg/services/trudi-confirm-recipients.service';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  MAP_TYPE_RECEIVER_TO_LABEL,
  MAP_TYPE_RECEIVER_TO_SUBLABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';

export interface IBulkSendToItem {
  id: string;
  label: string;
  isValid: boolean;
  type?: string;
  subLabel?: string;
  disabled?: boolean;
  data: ISelectedReceivers[];
}
@Component({
  selector: 'bulk-send-to',
  templateUrl: './bulk-send-to.component.html',
  styleUrls: ['./bulk-send-to.component.scss'],
  providers: []
})
export class BulkSendToComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedTasks = [];
  @Input() isSubmitted: boolean = false;
  @Input() configs: ISendMsgConfigs = defaultConfigs;

  private destroy$ = new Subject<void>();
  public listContactTypes = [];
  public listBulkSendTo = [];
  public isFocused = false;
  readonly EUserPropertyType = EUserPropertyType;
  public get bulkSendToControl() {
    return this.convertContactTypesToRecipientsService.bulkSendToControl;
  } // include contact types and external emails
  public selectedContactTypeIds = []; // only contact type
  public searchBulkSendToFn = (searchTerm: string, item) => {
    const searchTermLowerCase = searchTerm.trim().toLowerCase();
    const labelLowerCase = item.label.toLowerCase();
    return (
      item.type !== EUserPropertyType.UNIDENTIFIED &&
      labelLowerCase.includes(searchTermLowerCase)
    );
  };

  constructor(
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiConfirmRecipientService: TrudiConfirmRecipientService,
    private convertContactTypesToRecipientsService: ConvertContactTypesToRecipientsService,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  ngOnInit(): void {
    this.bulkSendToControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.selectedContactTypeIds = (
          this.bulkSendToControl.value || []
        )?.filter((selectedContactTypeId: string) =>
          this.listContactTypes.find((item) => selectedContactTypeId == item.id)
        );
        this.trudiSaveDraftService.setTrackControlChange(
          'selectedReceivers',
          true
        );
      });

    // Fetch data and handle logic when trigger step change
    combineLatest([
      this.getContactTypeListApi(),
      this.trudiSendMsgService.triggerStep$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([_, configs]) => {
        if (configs) {
          const contactTypes = configs.inputs.prefillData?.fields?.sendTo || [];
          const externalEmails = contactTypes.filter((item) =>
            EMAIL_PATTERN.test(item)
          );
          const externalEmailsData = externalEmails.map((email) =>
            this.addEmail(email)
          );
          this.listBulkSendTo = [
            ...this.listContactTypes,
            ...externalEmailsData
          ];

          // prefill contact types and external email from step data
          this.bulkSendToControl.setValue(
            this.listBulkSendTo
              .filter(
                (contact) =>
                  (contactTypes.includes(contact.type) ||
                    contactTypes.includes(contact.id)) &&
                  contact.data?.length
              )
              ?.map((a) => a.id)
          );

          // generate confirm recipients from bulk send to
          this.selectedContactTypeIds = (
            this.bulkSendToControl.value || []
          )?.filter((selectedContactTypeId: string) =>
            this.listContactTypes.find(
              (item) => selectedContactTypeId == item.id
            )
          );

          const confirmRecipients =
            this.convertContactTypesToRecipientsService.generateConfirmRecipientFirstTime(
              this.selectedContactTypeIds,
              externalEmailsData
            );
          this.trudiConfirmRecipientService.contactFormArray.setValue(
            confirmRecipients
          );
        }
      });

    this.trudiConfirmRecipientService.triggerRemoveConfirmRecipient$
      .pipe(takeUntil(this.destroy$))
      .subscribe((removeItem: ISelectedReceivers) => {
        const bulkSendToItemIds =
          this.convertContactTypesToRecipientsService.getBulkSendToItemsByRecipient(
            removeItem
          );
        this.bulkSendToControl.setValue(
          this.bulkSendToControl.value.filter(
            (item) =>
              !bulkSendToItemIds.some(
                (bulkSendToItemId) => bulkSendToItemId == item
              )
          )
        );
      });

    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_STEP
    ) {
      const newConfigs = {
        ...this.configs,
        'inputs.prefillData':
          this.configs.inputs.prefillData || this.configs.trudiButton
      };
      this.trudiSendMsgService.triggerStepBulkSend(newConfigs);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTasks']) {
      this.convertContactTypesToRecipientsService.initState(
        this.listContactTypes,
        this.selectedTasks
      );
    }

    if (changes['isSubmitted'] && changes['isSubmitted'].currentValue) {
      this.bulkSendToControl.markAsTouched();
      this.bulkSendToControl.markAsDirty();
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
          id: index,
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
        this.listBulkSendTo = this.listContactTypes;
        this.convertContactTypesToRecipientsService.initState(
          this.listContactTypes,
          this.selectedTasks
        );
      })
    );
  }

  handleClearSelection() {
    const externalEmails = this.bulkSendToControl.value.filter(
      (item: string) =>
        !this.listContactTypes.find((contactType) => contactType.id == item)
    );

    const confirmRecipients =
      this.convertContactTypesToRecipientsService.removeContactTypes(
        this.selectedContactTypeIds,
        externalEmails,
        this.trudiConfirmRecipientService.contactFormArray.value
      );
    this.trudiConfirmRecipientService.contactFormArray.setValue(
      confirmRecipients
    );

    this.bulkSendToControl.setValue(externalEmails);
  }

  handleRemoveItem(item: IBulkSendToItem) {
    if (!item.isValid) return;

    const confirmRecipients =
      this.convertContactTypesToRecipientsService.removeContactTypes(
        [item.id],
        this.bulkSendToControl.value,
        this.trudiConfirmRecipientService.contactFormArray.value
      );
    this.trudiConfirmRecipientService.contactFormArray.setValue(
      confirmRecipients
    );
  }

  handleClickOption(item) {
    if (item.disabled) return;

    const confirmRecipients = !item.selected
      ? this.convertContactTypesToRecipientsService.addContactType(
          item.value.id,
          this.trudiConfirmRecipientService.contactFormArray.value
        )
      : this.convertContactTypesToRecipientsService.removeContactTypes(
          [item.value.id],
          this.bulkSendToControl.value.filter(
            (bulkSendToId: string) => item.value.id !== bulkSendToId
          ),
          this.trudiConfirmRecipientService.contactFormArray.value
        );

    this.trudiConfirmRecipientService.contactFormArray.setValue(
      confirmRecipients
    );
  }

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

  handleAddExternalEmail(item) {
    if (item.type !== EUserPropertyType.UNIDENTIFIED) return;

    const isExistInListBulkSendTo = this.listBulkSendTo.find(
      (bulkToItem) => bulkToItem.id === item.id
    );
    if (!isExistInListBulkSendTo) {
      this.listBulkSendTo = [...this.listBulkSendTo, item];
    }

    // return if the new value already exists in the control
    const uniqueIds = Array.from(new Set(this.bulkSendToControl.value));
    if (uniqueIds.length !== this.bulkSendToControl.value.length) {
      this.bulkSendToControl.setValue(uniqueIds);
      return;
    }

    if (item.isValid) {
      const confirmRecipients =
        this.convertContactTypesToRecipientsService.addExternalEmail(
          [item],
          this.trudiConfirmRecipientService.contactFormArray.value
        );

      this.trudiConfirmRecipientService.contactFormArray.setValue(
        confirmRecipients
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  TrudiSendMsgFormService,
  validateReceivers
} from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { cloneDeep, uniqBy } from 'lodash-es';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { Subject, takeUntil } from 'rxjs';
import {
  IGetDynamicFieldsDataMessageScratchPayload,
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { IUserParticipant } from '@shared/types/user.interface';
import { ShareValidators } from '@shared/validators/share-validator';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';

interface IDisplayRecipient extends ISelectedReceivers {
  isChecked: boolean;
  isFromSelectRecipients?: boolean;
}

interface IViewRecipientFormValue {
  recipients: ISelectedReceivers[];
  extraRecipients: ISelectedReceivers[];
}

@Component({
  selector: 'view-recipients-modal',
  templateUrl: './view-recipients-modal.component.html',
  styleUrls: ['./view-recipients-modal.component.scss']
})
export class ViewRecipientsModalComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() visible: boolean = false;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() selectedTaskIds: string[] = [];
  @Input() isRmEnvironment: boolean = false;
  @Output() confirm = new EventEmitter<ISelectedReceivers[]>();
  // TODO: resolve this issue
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() close = new EventEmitter();
  private destroyed$ = new Subject<void>();
  public viewRecipientsForm: FormGroup = this.formBuilder.group({
    extraRecipients: new FormControl([], [validateReceivers()]),
    recipients: new FormControl([], [validateReceivers()])
  });
  public disabled: boolean = false;
  public displayRecipients: IDisplayRecipient[] = [];
  private defaultFormValue: IViewRecipientFormValue;
  public readonly ECreateMessageFrom = ECreateMessageFrom;
  public ignoreUsers: PrefillUser[] = [];
  public isFetchingData: boolean = false;
  private isChangedExtraRecipients: boolean = false;
  public selectedProperty: UserPropertyInPeople = null;
  public displayRecipientsString: string = '';

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get msgTitleControl(): AbstractControl {
    return this.sendMsgForm?.get('msgTitle');
  }

  get extraRecipientsControl(): AbstractControl {
    return this.viewRecipientsForm?.get('extraRecipients');
  }

  get recipientsControl(): AbstractControl {
    return this.viewRecipientsForm?.get('recipients');
  }

  get isCreateMessageFromMultiMessage() {
    return (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.MULTI_MESSAGES
    );
  }

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private formBuilder: FormBuilder,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe
  ) {}

  ngOnInit(): void {
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_STEP
    ) {
      const { propertyId } = this.trudiSendMsgService.getIDsFromOtherService();
      this.selectedProperty = { id: propertyId } as UserPropertyInPeople;
    }
    this.subscribeDefaultRecipients();
    this.handleChangeExtraRecipients();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.isChangedExtraRecipients = false;
      this.defaultFormValue = this.viewRecipientsForm.value;
    }
  }

  subscribeDefaultRecipients() {
    this.trudiSendMsgService.viewRecipientList$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((res) => {
        if (res) {
          this.selectedReceivers.setValue(res);
          this.defaultFormValue = {
            extraRecipients: this.defaultFormValue?.extraRecipients || [],
            recipients: res
          };
          this.recipientsControl.setValue(res);
          this.displayRecipients = this.getDisplayRecipients(res, res);
          if (
            this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.MULTI_MESSAGES
          ) {
            this.displayRecipients = this.displayRecipients.map(
              (recipient) => ({
                ...recipient,
                recipientParticipantsTitle: recipient.participants
                  .map((participant) => {
                    return this.contactTitleByConversationPropertyPipe.transform(
                      participant,
                      {
                        isNoPropertyConversation: !recipient.propertyId,
                        isMatchingPropertyWithConversation:
                          recipient.propertyId &&
                          participant.propertyId === recipient.propertyId,
                        showFullContactRole: true
                      }
                    );
                  })
                  .join(', ')
              })
            );
          } else {
            this.displayRecipients = this.displayRecipients.map(
              (recipient) => ({
                ...recipient,
                recipientTitle:
                  this.contactTitleByConversationPropertyPipe.transform(
                    recipient,
                    {
                      isNoPropertyConversation:
                        recipient.isFromSelectRecipients ||
                        this.configs.otherConfigs.isFromContactPage
                          ? false
                          : !this.property?.value,
                      isMatchingPropertyWithConversation:
                        recipient.isFromSelectRecipients ||
                        this.configs.otherConfigs.isFromContactPage
                          ? true
                          : this.property?.value?.id &&
                            recipient?.propertyId === this.property.value?.id,
                      showFullContactRole: true
                    }
                  )
              })
            );
          }
          this.generateIgnoreUsers();
        }
      });
  }

  generateIgnoreUsers() {
    let ignoreUsers = [];
    if (this.isCreateMessageFromMultiMessage) {
      ignoreUsers = this.displayRecipients
        ?.flatMap(
          (recipient) =>
            (recipient.participants || []) as unknown as IUserParticipant[]
        )
        .map((participant) => ({
          id: participant.userId,
          propertyId: participant.propertyId
        }));
    } else {
      ignoreUsers = this.displayRecipients?.map((recipient) => ({
        id: recipient.id,
        propertyId: recipient.propertyId
      }));
    }

    this.ignoreUsers = uniqBy(ignoreUsers, (item) => {
      return item.id + '_' + (item.propertyId || '');
    });
  }

  getDisplayRecipients(
    recipients: ISelectedReceivers[],
    selectedRecipients: ISelectedReceivers[]
  ) {
    return cloneDeep(recipients || []).map((item) => {
      const isChecked = this.isCreateMessageFromMultiMessage
        ? selectedRecipients?.some(
            (message) => message.conversationId === item.conversationId
          )
        : selectedRecipients?.some(
            (recipient) =>
              recipient.id === item.id &&
              recipient.propertyId === item.propertyId
          );
      return {
        ...item,
        isChecked
      };
    });
  }

  async handleConfirm() {
    this.isFetchingData = true;
    const messages = cloneDeep(this.displayRecipients).filter(
      (recipient) => recipient.isChecked
    );
    messages.forEach((recipient) => {
      delete recipient.isChecked;
    });

    let extraRecipients = this.extraRecipientsControl.value || [];

    // handle modify recipients data
    if (this.isCreateMessageFromMultiMessage) {
      if (extraRecipients.length > 0) {
        this.msgTitleControl.enable();
        this.msgTitleControl.setValidators([
          Validators.required,
          ShareValidators.trimValidator
        ]);
        this.trudiSendMsgService.setHiddenTextFieldTitle(false);
      } else {
        this.msgTitleControl.disable();
        this.msgTitleControl.setValue('');
        this.msgTitleControl.setValidators([]);
        this.trudiSendMsgService.setHiddenTextFieldTitle(true);
      }

      const userDetailPayload = extraRecipients
        .filter((recipient) => recipient.id && recipient.propertyId)
        .map((recipient) => ({
          userId: recipient.id,
          propertyId: recipient.propertyId
        }));

      const userDetailsData =
        this.isChangedExtraRecipients && userDetailPayload.length > 0
          ? await this.getPropertyDataToPrefillDynamicParams(userDetailPayload)
          : [];

      extraRecipients = extraRecipients.map((item) => {
        const propertyData =
          userDetailsData.find(
            (it) => item.id === it.userId && item.propertyId === it.property?.id
          ) || {};
        return {
          ...item,
          ...propertyData,
          participants: [
            {
              ...item,
              userId: item.id,
              userPropertyType: item.userPropertyId ? item.type : null
            }
          ]
        };
      });
    }

    this.selectedReceivers.setValue([...messages, ...extraRecipients]);
    this.trudiSendMsgService.setPopupState({
      sendMessage: true,
      viewRecipients: false
    });
    this.isFetchingData = false;
    this.confirm.emit([...messages, ...extraRecipients]);
  }

  resetPopupState() {
    this.viewRecipientsForm.setValue(this.defaultFormValue || {});
    this.trudiSendMsgService.setPopupState({
      sendMessage: true,
      viewRecipients: false
    });
  }

  handleBack() {
    this.resetPopupState();
  }

  handleCancel() {
    this.resetPopupState();
    this.close.emit(true);
  }

  handleAfterClose() {
    this.isChangedExtraRecipients = false;
    this.defaultFormValue = null;
    this.displayRecipients = this.getDisplayRecipients(
      this.displayRecipients,
      this.recipientsControl.value
    );
  }

  getPropertyDataToPrefillDynamicParams(userProperties = []) {
    const payload = {
      propertyId: null,
      userProperties: userProperties
    } as IGetDynamicFieldsDataMessageScratchPayload;
    return this.trudiSendMsgUserService
      .getDynamicFieldsDataMessageScratchApi(payload)
      .pipe(takeUntil(this.destroyed$))
      .toPromise();
  }

  handleChangeSelectedRecipients() {
    this.recipientsControl.setValue(
      this.displayRecipients.filter((item) => item.isChecked)
    );
    this.handleUpdateDisabledConfirm();
  }

  handleChangeExtraRecipients() {
    this.extraRecipientsControl.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (this.visible) {
          this.isChangedExtraRecipients = true;
        }
        this.handleUpdateDisabledConfirm();
      });
  }

  handleUpdateDisabledConfirm() {
    this.disabled =
      !this.recipientsControl.value?.length &&
      !this.extraRecipientsControl.value?.length;
  }

  compareWith(receiverA: ISelectedReceivers, receiverB: ISelectedReceivers) {
    return (
      receiverA.id === receiverB.id &&
      receiverA.propertyId == receiverB.propertyId
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

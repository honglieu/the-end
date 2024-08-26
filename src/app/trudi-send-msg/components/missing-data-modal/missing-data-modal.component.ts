import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import {
  IProcessedReceiver,
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { getUniqReceiverData } from '@/app/trudi-send-msg/utils/helper-functions';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { FormatParticipants } from '@shared/pipes/format-participants.pipe';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'missing-data-modal',
  templateUrl: './missing-data-modal.component.html',
  styleUrls: ['./missing-data-modal.component.scss']
})
export class MissingDataModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() data: Record<string, Array<ISelectedReceivers>> = {};
  @Input() isRmEnvironment: boolean = false;
  @Output() editMessage = new EventEmitter<void>();
  @Output() keepSending = new EventEmitter<void>();
  public listParamMissingData;
  public ECreateMessageFrom = ECreateMessageFrom;

  constructor(
    private formatParticipantsPipe: FormatParticipants,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    public cdr: ChangeDetectorRef,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.handleShowModalInvalidDynamicParam(changes['data'].currentValue);
    }
    if (changes['visible'] && changes['visible'].currentValue) {
      this.cdr.markForCheck();
    }
  }

  handleContinueEditMessage() {
    this.visibleChange.emit(false);
    this.editMessage.emit();
  }

  handleKeepSending() {
    this.visibleChange.emit(false);
    this.keepSending.emit();
  }

  get property() {
    return this.trudiSendMsgFormService?.sendMsgForm?.get('property');
  }

  handleShowModalInvalidDynamicParam(
    listInvalidParams: Record<string, Array<IProcessedReceiver>>
  ) {
    const map = Object.entries(listInvalidParams).reduce((prev, value) => {
      if (
        this.configs?.otherConfigs?.createMessageFrom ===
          ECreateMessageFrom.SCRATCH ||
        this.configs?.otherConfigs?.createMessageFrom ===
          ECreateMessageFrom.TASK_HEADER
      ) {
        const participantsJoinName = getUniqReceiverData(value[1])
          .map((receiver) => {
            return this.contactTitleByConversationPropertyPipe.transform(
              receiver,
              {
                isNoPropertyConversation: !this.property?.value,
                isMatchingPropertyWithConversation:
                  this.property?.value &&
                  receiver?.propertyId === this.property.value.id,
                showFullContactRole: true
              }
            );
          })
          .join(', ');

        const invalidParams = [
          ...(prev[participantsJoinName]?.params || []),
          value[0]
        ];

        prev[participantsJoinName] = {
          params: invalidParams,
          users: getUniqReceiverData(value[1]),
          formattedName: participantsJoinName
        };
      } else {
        value[1].forEach((selectedReceiver) => {
          let participantsJoinName = '';

          if (
            this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.MULTI_MESSAGES
          ) {
            participantsJoinName = selectedReceiver.participants
              .map((participant) => {
                return this.contactTitleByConversationPropertyPipe.transform(
                  participant,
                  {
                    isNoPropertyConversation: !selectedReceiver.propertyId,
                    isMatchingPropertyWithConversation:
                      selectedReceiver.propertyId &&
                      participant?.propertyId === selectedReceiver.propertyId,
                    showFullContactRole: true
                  }
                );
              })
              .join(', ');
          } else {
            const typeSend =
              (this.configs.trudiButton as TrudiStep)?.fields.typeSend ||
              this.configs.inputs.prefillData?.fields?.typeSend;
            const isSendSingleEmail = typeSend === ETypeSend.SINGLE_EMAIL;
            if (isSendSingleEmail) {
              participantsJoinName = (selectedReceiver['recipients'] || [])
                .map((item) =>
                  this.contactTitleByConversationPropertyPipe.transform(item, {
                    isNoPropertyConversation:
                      item.isFromSelectRecipients ||
                      this.configs.otherConfigs.isFromContactPage
                        ? false
                        : !this.property?.value,
                    isMatchingPropertyWithConversation:
                      item.isFromSelectRecipients ||
                      this.configs.otherConfigs.isFromContactPage
                        ? true
                        : this.property?.value?.id &&
                          item?.propertyId === this.property.value?.id,
                    showFullContactRole: true
                  })
                )
                .join(', ');
            } else {
              participantsJoinName =
                this.contactTitleByConversationPropertyPipe.transform(
                  selectedReceiver,
                  {
                    isNoPropertyConversation:
                      selectedReceiver.isFromSelectRecipients ||
                      this.configs.otherConfigs.isFromContactPage
                        ? false
                        : !this.property?.value,
                    isMatchingPropertyWithConversation:
                      selectedReceiver.isFromSelectRecipients ||
                      this.configs.otherConfigs.isFromContactPage
                        ? true
                        : this.property?.value?.id &&
                          (selectedReceiver?.actualPropertyId ||
                            selectedReceiver?.propertyId) ===
                            this.property.value?.id,
                    showFullContactRole: true
                  }
                );
            }
          }

          const key = `${selectedReceiver.id || ''}_${
            selectedReceiver.propertyId || ''
          }_${selectedReceiver.taskId || ''}`;
          const invalidParams = [...(prev[key]?.params || []), value[0]];
          prev[key] = {
            params: invalidParams,
            user: selectedReceiver,
            formattedName: participantsJoinName
          };
        });
      }

      return prev;
    }, {});
    this.listParamMissingData = Object.keys(map).map((key) => {
      return { uniqKey: key, ...map[key] };
    });
  }
}

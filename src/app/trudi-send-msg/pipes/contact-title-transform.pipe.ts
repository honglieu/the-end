import { Pipe, PipeTransform } from '@angular/core';
import { IDisplayRecipient } from '@/app/trudi-send-msg/components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/confirm-recipient/confirm-recipient.component';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { EConfirmContactType } from '@shared/enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
export interface ContactTitlePipeOptions {
  createFrom: ECreateMessageFrom;
  propertyId: string;
  ccReceivers: ISelectedReceivers[];
  bccReceivers: ISelectedReceivers[];
}
@Pipe({ name: 'contactTitle' })
export class ContactTitlePipe implements PipeTransform {
  constructor(
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe
  ) {}
  transform(recipient: IDisplayRecipient, options: ContactTitlePipeOptions) {
    let ccReceiversText = '';
    let bccReceiversText = '';
    if (options.ccReceivers?.length) {
      ccReceiversText =
        ', Cc: ' +
        this.handleTransformCcAndBccReceiversToText(
          options.propertyId,
          options.ccReceivers
        );
    }
    if (options.bccReceivers?.length) {
      bccReceiversText =
        ', Bcc: ' +
        this.handleTransformCcAndBccReceiversToText(
          options.propertyId,
          options.bccReceivers
        );
    }
    if (recipient.type === EConfirmContactType.UNIDENTIFIED) {
      const unidentifiedRecipient = recipient['isValid']
        ? `${recipient.email} (Unrecognized)`
        : recipient.email;
      return unidentifiedRecipient + ccReceiversText + bccReceiversText;
    }

    if (options?.createFrom === ECreateMessageFrom.MULTI_MESSAGES) {
      return recipient.participants
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
        .join(', ');
    }

    const isFromContactPage =
      options?.createFrom === ECreateMessageFrom.CONTACT;
    return (
      this.contactTitleByConversationPropertyPipe.transform(recipient, {
        isNoPropertyConversation: isFromContactPage
          ? false
          : !options?.propertyId,
        isMatchingPropertyWithConversation: isFromContactPage
          ? true
          : options?.propertyId &&
            recipient?.propertyId === options?.propertyId,
        showFullContactRole: true
      }) +
      ccReceiversText +
      bccReceiversText
    );
  }

  handleTransformCcAndBccReceiversToText(
    propertyId: string,
    receivers: ISelectedReceivers[]
  ) {
    return receivers
      .map((receiver) => {
        if (receiver.type === EConfirmContactType.UNIDENTIFIED) {
          return receiver['isValid']
            ? `${receiver.email} (Unrecognized)`
            : receiver.email;
        }

        return this.contactTitleByConversationPropertyPipe.transform(receiver, {
          isNoPropertyConversation: !receiver?.propertyId,
          isMatchingPropertyWithConversation:
            propertyId && propertyId === receiver?.propertyId,
          showFullContactRole: true
        });
      })
      .join(', ');
  }
}

import { IMessage } from '@shared/types/message.interface';
import { IUserParticipant } from '@shared/types/user.interface';

export function mapEmailMetadata(
  participantChanged: IUserParticipant,
  message: IMessage
) {
  const recipients = [
    ...(message?.emailMetadata?.to || []),
    ...(message?.emailMetadata?.cc || []),
    ...(message?.emailMetadata?.bcc || []),
    ...(message?.emailMetadata?.from || [])
  ];
  recipients.forEach((one) => {
    if (participantChanged?.oldUserId === one.userId) {
      one.userId = participantChanged.userId || one.userId;
      one.crmStatus = participantChanged.crmStatus;
      one.propertyId = participantChanged.propertyId;
      one.firstName = participantChanged.firstName;
      one.lastName = participantChanged.lastName;
      one.isPrimary = participantChanged.isPrimary;
      one.userType = participantChanged.type;
      one.isTemporary = participantChanged.isTemporary;
      one.userPropertyType = participantChanged.userPropertyType;
      one.secondaryEmailId = participantChanged.secondaryEmailId;
      one.contactType = participantChanged.contactType;
      one.userPropertyContactType = participantChanged.userPropertyContactType;
      one.recognitionStatus = participantChanged.recognitionStatus;
      one.googleAvatar = participantChanged.googleAvatar;
      one.type = participantChanged.type;
      one.userPropertyId = participantChanged.userPropertyId;
    }

    if (participantChanged.oldUserId === message.userId) {
      message.userId = participantChanged.userId;
      message.firstName = participantChanged.firstName;
      message.lastName = participantChanged.lastName;
      message.isPrimary = participantChanged.isPrimary;
      message.userType = participantChanged.type;
      message.userPropertyType = participantChanged.userPropertyType;
      message.propertyId = participantChanged.propertyId;
      message.crmStatus = participantChanged.crmStatus;
    }
  });
  if (recipients && recipients.length) {
    message.emailMetadata = JSON.parse(JSON.stringify(message.emailMetadata));
    message = JSON.parse(JSON.stringify(message));
  }
}

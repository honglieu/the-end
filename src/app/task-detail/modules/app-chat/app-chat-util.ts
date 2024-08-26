import { EMessageComeFromType, EMessageType } from '@shared/enum';
import { IFile } from '@shared/types/file.interface';
import dayjs from 'dayjs';
import uuid4 from 'uuid4';
import { cloneDeep } from 'lodash-es';
import { ISendMsgPayload } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { ICompany } from '@shared/types/company.interface';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export class AppChatUtil {
  static getNow(): string {
    return new Date().toISOString();
  }

  static getTicketDetails(listofTicketCategory, id) {
    const categoryDetail = listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
  }

  static getCategoryDitails(listofConversationCategory, categoryId) {
    const categoryDetails =
      listofConversationCategory.find((cat) => cat.id === categoryId) || {};
    if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
      categoryDetails.svg = 'old-rent.svg';
      categoryDetails.color = 'rgb(0, 169, 159)';
    }
    return categoryDetails;
  }

  static formatDateString(inputDate: string) {
    const parsedDate = dayjs(inputDate);
    const offsetInMinutes = parsedDate.utcOffset();
    const utcDate = parsedDate.subtract(offsetInMinutes, 'minute');
    const formattedDate = utcDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    return formattedDate;
  }

  static parseMessageToObject(message, messageType): any {
    if (!message && message !== '') {
      return;
    }

    if (message === '') {
      return [{ type: messageType.text, value: '' }];
    }

    // tslint:disable-next-line:max-line-length
    const regExpUrl =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
    const regExpWhiteSpace = /\s/g;
    const defaultTypeExp = /(:\*\*\()/gim;
    let fromIndex = 0;
    let regRes;
    const res = [];
    if (!res.find((r) => r.value === message)) {
      if (regExpUrl.test(message)) {
        if (regExpWhiteSpace.test(message)) {
          res.push({
            type: messageType.text,
            value: message
          });
        } else {
          res.push({
            type: messageType.url,
            value: message
          });
        }
        fromIndex = regExpUrl.lastIndex;
      } else {
        res.push({
          type: messageType.text,
          value: message
        });
      }
    }
    while ((regRes = defaultTypeExp.exec(message)) !== null) {
      res.push({
        type: 'otherTypes',
        value: regRes[0]
      });
      fromIndex = regExpUrl.lastIndex;
    }
    return res;
  }

  static compareDates(a, b) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  static genMessageTemp(
    event,
    options: {
      currentUser: CurrentUser;
      currentCompany: ICompany;
      cacheBodyMessages: Map<string, ISendMsgPayload>;
      agencyFacebookAvatar?: string;
    }
  ) {
    const { content, files, contacts, tempId } = event.data?.['emailMessage'];
    const {
      currentUser,
      currentCompany,
      cacheBodyMessages,
      agencyFacebookAvatar
    } = options;
    const messages = [];
    const hasContent = !this.isEmptyOrWhiteSpaceHTML(content);
    const hasContacts = contacts?.length > 0;

    let index = 0;
    if (hasContent || (!hasContent && hasContacts)) {
      messages.push(
        this.genDynamicMessage(event, {
          tempId: tempId,
          messageType: EMessageType.defaultText,
          index,
          currentUser,
          currentCompany,
          cacheBodyMessages,
          agencyFacebookAvatar
        })
      );
      index++;
    }

    files?.forEach((file) => {
      messages.push(
        this.genDynamicMessage(event, {
          tempId: file.tempId,
          messageType: EMessageType.file,
          file,
          index,
          currentUser,
          currentCompany,
          cacheBodyMessages,
          agencyFacebookAvatar
        })
      );
      index++;
    });

    return messages;
  }

  static genDynamicMessage(
    event,
    options: {
      tempId: string;
      messageType: EMessageType;
      file?: IFile;
      index: number;
      currentUser: CurrentUser;
      currentCompany: ICompany;
      cacheBodyMessages: Map<string, ISendMsgPayload>;
      agencyFacebookAvatar?: string;
    }
  ) {
    const {
      tempId,
      messageType,
      file,
      index,
      currentUser,
      currentCompany,
      cacheBodyMessages,
      agencyFacebookAvatar
    } = options;
    const {
      conversationId,
      userId,
      content,
      offBoardedDate,
      recognitionStatus,
      contacts = [],
      replyToMessageId
    } = event.data?.['emailMessage'];

    const currentDate = new Date();
    currentDate.setMilliseconds(currentDate.getMilliseconds() + index);
    const createdAt = currentDate.toISOString();

    const {
      id,
      firstName,
      lastName,
      googleAvatar,
      type,
      email,
      iviteSent,
      lastActivity,
      status,
      isTemporary,
      phoneNumber,
      userProperties,
      title
    } = currentUser;
    const message = {
      id: tempId,
      isSending: true,
      avatar: agencyFacebookAvatar,
      userId,
      conversationId,
      message: messageType === EMessageType.defaultText ? content : '',
      isDraft: false,
      replyToMessageId,
      ticketFile: [],
      isRead: false,
      type,
      options: {
        contacts: !file ? contacts : []
      },
      createdAt,
      categoryId: null,
      propertyId: event.data?.['propertyId'],
      status,
      firstName,
      lastName,
      fromPhoneNumber: phoneNumber,
      email,
      secondaryEmail: email,
      userType: type,
      phoneNumber,
      recognitionStatus,
      createdFrom: EMessageComeFromType.APP,
      contactType: null,
      landingPage: null,
      isUnVerifiedPhoneNumber: true,
      trudiResponse: null,
      userTitle: title,
      messageCall: null,
      file: file && {
        id: uuid4(),
        url: file.fileName,
        name: file.fileName,
        size: file.fileSize,
        propertyId: file.propertyId,
        userId,
        showForLandlord: null,
        showForTenant: null,
        mediaLink: file.mediaLink,
        thumbMediaLink: null,
        documentTypeId: file.documentTypeId,
        tenantId: null,
        conversationId,
        taskId: null,
        isUserUpload: false,
        title: null,
        syncPTType: null,
        syncedByUserId: null,
        syncedDate: null,
        fileOrigin: null,
        description: null,
        source: null,
        isDraft: false,
        invoiceDetails: null,
        createdAt
      },
      messageType: messageType,
      callType: null,
      actionLink: {
        contacts: !file ? contacts : []
      },
      googleAvatar,
      messageReply: event.data?.['messageReply'],
      userPropertyType: null,
      idUserPropertyGroup: null,
      isPrimary: null,
      agencyName: currentCompany.name,
      agencyEmail: currentCompany.companyEmail,
      agencyOutgoingEmail: currentCompany.outgoingEmail,
      voiceMailPhoneNumber: currentCompany.voiceMailPhoneNumber,
      isShowFile: true,
      isSendFromEmail: false,
      isSendFromVoiceMail: false,
      bulkMessageId: null,
      crmStatus: null,
      iviteSent,
      lastActivity,
      offBoardedDate,
      userPropertyContactType: null,
      emailStatus: null,
      emailStatusChangeDate: null,
      cloneConversationId: null,
      emailMetadata: {
        from: [
          {
            userId: id,
            propertyId: userProperties.propertyId,
            email: email,
            secondaryEmail: null,
            firstName: firstName,
            lastName,
            isTemporary,
            userType: type,
            userPropertyType: null,
            userPropertyId: null,
            googleAvatar,
            isPrimary: userProperties.isPrimary,
            secondaryEmailId: null,
            crmStatus: status,
            contactType: userProperties.contactType,
            originalEmailName: email,
            userPropertyContactType: null,
            recognitionStatus,
            iviteSent,
            lastActivity,
            offBoardedDate,
            role: null,
            isAppUser: null,
            type: null
          }
        ],
        to: [],
        cc: [],
        bcc: []
      },
      mailMessageId: null,
      textContent: '',
      isLastReadMessage: false,
      conversationLogId: null,
      languageCode: null,
      messagesTranslate: null,
      messagesTranslateText: '',
      unhandledAttachmentCount: 0,
      isSyncedAttachment: true,
      oldPropertyId: null,
      newPropertyId: null,
      title: null,
      mailMessageRead: true,
      creator: {
        id: id,
        firstName,
        email,
        lastName,
        title,
        type
      },
      userPropertyId: null,
      isAutomatedReply: false,
      isMarkUnRead: false,
      lastSeen: null,
      isReplyTicketOfConversation: false,
      draftMessageId: null,
      isTemp: true,
      senderType: 'PM'
    };

    const body = cloneDeep(event.data) as ISendMsgPayload;
    if (messageType === EMessageType.defaultText) {
      body.emailMessage.files = [];
    }
    if (messageType === EMessageType.file) {
      body.emailMessage.contacts = [];
      body.emailMessage.content = '<p></p>';
    }
    cacheBodyMessages.set(message.id, body);
    return message;
  }

  static isEmptyOrWhiteSpaceHTML(htmlString: string) {
    if (typeof htmlString !== 'string' || !htmlString?.trim()) {
      return true;
    }
    return /^<(\w+)(\s+[^>]*)?>\s*<\/\1>$/.test(htmlString.trim());
  }

  static checkCanLoadNewMessage(
    lastTime,
    listResponse: (IWhatsappMessage | IFacebookMessage)[]
  ) {
    const lastTimeStamp = new Date(lastTime).getTime();
    return (
      lastTimeStamp &&
      listResponse.some(
        (one) => new Date(one.createdAt).getTime() > lastTimeStamp
      )
    );
  }
}

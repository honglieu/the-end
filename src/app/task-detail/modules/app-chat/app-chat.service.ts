import { SHORT_ISO_DATE, trudiUserId } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { UserService } from '@services/user.service';
import { EMessageType, EUserPropertyType, UserTypeEnum } from '@shared/enum';
import { Injectable } from '@angular/core';
import { AppChatUtil } from './app-chat-util';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { FilesService } from '@services/files.service';
import { BehaviorSubject } from 'rxjs';
import { IMessage } from '@/app/shared';

@Injectable({
  providedIn: null
})
export class AppChatService {
  private lastReadMessageIndex = new BehaviorSubject<number>(-1);
  public lastReadMessageIndex$ = this.lastReadMessageIndex.asObservable();
  constructor(
    private conversationService: ConversationService,
    private userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService,
    private filesService: FilesService
  ) {}

  updateLastReadMessageIndex(lastReadMessageIndex: number) {
    this.lastReadMessageIndex.next(lastReadMessageIndex);
  }

  handleMapListMessage(messages: IMessage[]) {
    const arrType = [
      EMessageType.reopened,
      EMessageType.changeProperty,
      EMessageType.deleted,
      EMessageType.agentExpectation,
      EMessageType.moveToTask,
      EMessageType.solved,
      EMessageType.endSession,
      EMessageType.startSession
    ];
    this.updateLastReadMessageIndex(-1);
    const newMessages = messages.map((message, index) => {
      const participants = message?.messageCall?.participiants;
      if (participants) {
        participants.forEach((participant) => {
          if (participant?.messageCallParticipiant?.joinedAt) {
            participant.joinedAt = participant.messageCallParticipiant.joinedAt;
          }
        });
      }
      if (message) {
        let classForMarker = [];
        const prevMessageType = messages[index - 1]?.messageType;
        const nextMessageType = messages[index + 1]?.messageType;
        const isShowAgentJoin = !this.conversationService.checkIsSendFromEmail(
          message?.conversationId
        );

        if (message.messageType === EMessageType.agentJoin && isShowAgentJoin) {
          if (
            prevMessageType === EMessageType.defaultText ||
            prevMessageType === EMessageType.ticket
          ) {
            classForMarker.push('mt-16');
          }
          if (
            nextMessageType === EMessageType.defaultText ||
            nextMessageType === EMessageType.ticket
          ) {
            classForMarker.push('mb-16');
          }
        }

        if (arrType.includes(message?.messageType)) {
          switch (prevMessageType) {
            case EMessageType.defaultText:
            case EMessageType.ticket:
              classForMarker.push('mt-16');
              break;
            case EMessageType.agentJoin:
              const isHideAgentJoinPrevious =
                this.conversationService.checkIsSendFromEmail(
                  messages[index - 1]?.conversationId
                );
              if (isHideAgentJoinPrevious) {
                classForMarker.push('mt-16');
              }
              break;
          }

          switch (nextMessageType) {
            case EMessageType.defaultText:
            case EMessageType.ticket:
              classForMarker.push('mb-16');
              break;
            case EMessageType.agentJoin:
              const isHideAgentJoinNext =
                this.conversationService.checkIsSendFromEmail(
                  messages[index + 1]?.conversationId
                );
              if (isHideAgentJoinNext) {
                classForMarker.push('mb-16');
              }
              break;
          }
        }
        message.classForMarker = classForMarker.join(' ');
      }
      return message;
    });
    this.checkIsLastReadMessage(newMessages);
    return newMessages;
  }

  private checkIsLastReadMessage(messages: IMessage[]) {
    const lastReadMessageIndex = messages.findIndex(
      (msg) => msg.isLastReadMessage
    );

    if (lastReadMessageIndex !== -1) {
      let foundNextValidMessage = false;
      for (let i = lastReadMessageIndex + 1; i < messages.length; i++) {
        if (
          messages[i]?.userType !== EUserPropertyType.LEAD &&
          [EMessageType.defaultText, EMessageType.file].includes(
            messages[i]?.messageType.toUpperCase() as EMessageType
          )
        ) {
          messages[lastReadMessageIndex].isLastReadMessage = false;
          messages[i].isLastReadMessage = true;
          this.updateLastReadMessageIndex(i);
          foundNextValidMessage = true;
          break;
        }
      }

      if (!foundNextValidMessage) {
        messages[lastReadMessageIndex].isLastReadMessage = false;
      }
    }
  }

  detectUserRole(
    currentConversation,
    userType: string,
    type: string,
    userId: string,
    isSendFromEmail?: boolean,
    messageType?: EMessageType
  ) {
    if (messageType === EMessageType.call) {
      return 'admin';
    }

    if (!userType || !userId || !type) {
      return '';
    }
    let role = '';
    if (
      this.userService.checkConsoleUserRole(userType.toLowerCase()) ||
      this.userService.checkConsoleUserRole(type.toLowerCase()) ||
      userType.toUpperCase() === UserTypeEnum.MAILBOX ||
      userId === localStorage.getItem('userId')
    ) {
      role = userId === trudiUserId ? 'trudi' : 'admin';
    } else {
      role =
        userType === 'trudi' && type === 'trudi' && userId === trudiUserId
          ? 'trudi'
          : 'user';
    }
    if (
      currentConversation?.isFrozen &&
      (currentConversation.lastUser?.id === trudiUserId ||
        currentConversation.status === 'RESOLVED')
    ) {
      role += ' non-app-user';
    }
    if (isSendFromEmail) {
      role += ' send-from-email';
    }
    return role;
  }

  mapMessageProperties(
    listofmessages,
    currentConversation,
    listofTicketCategory,
    listofConversationCategory
  ) {
    if (!listofmessages) return;
    listofmessages = listofmessages.map((message) => {
      message.senderType = this.detectUserRole(
        currentConversation,
        message.userType,
        message.type,
        message.userId,
        message.isSendFromEmail,
        message?.messageType
      );
      message.messageType = message.messageType.toUpperCase() as EMessageType;
      if (message.messageType === EMessageType.actionLink) {
        const categoryDetail = AppChatUtil.getCategoryDitails(
          listofConversationCategory,
          message.actionLink.topicId
        );
        message.color = categoryDetail.color;
        message.svg = categoryDetail.svg;
      } else if (
        message.messageType === EMessageType.ticket &&
        (message.options?.ticket?.ticketCategoryId ||
          message.options?.ticketCategoryId)
      ) {
        if (message.options.type === 'MUlTIPLE_TASK') {
          message.ticketCategoryInfo = AppChatUtil.getTicketDetails(
            listofTicketCategory,
            message.options.ticket.ticketCategoryId
          );
        } else {
          message.ticketCategoryInfo = AppChatUtil.getTicketDetails(
            listofTicketCategory,
            message.options.ticketCategoryId
          );
        }
      }
      if (message.isSendFromEmail) {
        if (typeof message.message === 'string') {
          message.message = message.message
            .replace(/\r/g, '')
            .replace(/\n{3,}/g, '\n\n');
        } else {
          message.message = message.message.map((item) => {
            item.value = item.value
              .replace(/\r/g, '')
              .replace(/\n{3,}/g, '\n\n');
            return item;
          });
        }
      }
      message.trackId = this.messageTrackBy(message);
      return message;
    });
  }

  messageTrackBy(message) {
    if (message?.messageType === EMessageType.call) {
      return message.id + message?.messageCall?.endedAt;
    }
    if (message?.emailMetadata?.from?.[0]?.userId) {
      return (
        message.id +
        message.createdAt +
        message?.emailMetadata?.from?.[0]?.userId
      );
    }
    return message.id + message.createdAt;
  }

  mapUnreadMessage(
    listofmessages,
    groupMessage,
    previousMessageId?: string,
    isRead?: boolean,
    isUpdateOne: boolean = false
  ) {
    if (previousMessageId) {
      listofmessages = listofmessages.map((message) => {
        if (isUpdateOne) {
          if (message.id === previousMessageId) {
            return {
              ...message,
              isLastReadMessage: isRead
            };
          }
          return message;
        }
        return {
          ...message,
          isLastReadMessage: message.id === previousMessageId
        };
      });
      groupMessage = groupMessage.map((group) => {
        if (group.messages.length) {
          group.messages?.forEach((element) => {
            if (isUpdateOne) {
              if (element.id === previousMessageId) {
                element.isLastReadMessage = isRead;
              }
            } else {
              element.isLastReadMessage =
                element.id === previousMessageId ? isRead : !isRead;
            }
          });
          group.messages = JSON.parse(JSON.stringify(group.messages));
        }
        return group;
      });
      return;
    }
    listofmessages = listofmessages.map((message) => {
      return {
        ...message,
        isLastReadMessage: isRead
      };
    });
    groupMessage = groupMessage.map((group) => {
      if (group.messages.length) {
        group.messages?.forEach((element) => {
          element.isLastReadMessage = isRead;
        });
        group.messages = JSON.parse(JSON.stringify(group.messages));
      }
      return group;
    });
  }

  groupMessagesByDate(messages) {
    const listMessage = this.handleMapListMessage(messages);
    const isMessageEmpty = (message) => {
      return (
        (message.messageType?.toUpperCase() === EMessageType.defaultText &&
          message.message === '<p></p>' &&
          !message?.actionLink?.contacts?.length) ||
        (message.message?.[0]?.value === '<p></p>' &&
          message.message?.[0]?.type?.toUpperCase() ===
            EMessageType.defaultText &&
          !message?.actionLink?.contacts?.length)
      );
    };
    const grouped = listMessage.reduce((acc, message) => {
      if (isMessageEmpty(message)) return acc;
      const date: string = this.agencyDateFormatService
        .agencyDayJs(message?.createdAt)
        .format(SHORT_ISO_DATE);
      if (!acc[date]) {
        acc[date] = {
          timeStamp: date,
          messages: [message]
        };
      } else {
        acc[date].messages.push(message);
      }
      return acc;
    }, {});
    return Object.values(grouped);
  }

  mapFileMessageToMessage(currentMess, fileMess) {
    if (fileMess.file && fileMess.file?.fileType && fileMess.isShowFile) {
      switch (
        this.filesService.getFileTypeSlash(fileMess.file?.fileType?.name)
      ) {
        case 'video':
        case 'photo':
        case 'audio':
          currentMess?.files?.mediaList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
        case 'file':
          currentMess?.files?.fileList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
      }
    } else if (!fileMess.file?.fileType || !fileMess.isShowFile) {
      currentMess?.files?.unSupportedList.push({
        ...fileMess.file,
        isShowFile: true,
        messageId: fileMess.id,
        createdAt: fileMess.createdAt
      });
    }
  }

  getInviteDeactive(currentConversation, userInviteStatusType) {
    if (
      currentConversation?.crmStatus === 'ACTIVE' &&
      currentConversation.secondaryEmail
    ) {
      return true;
    } else {
      return (
        this.userService.getStatusInvite(
          currentConversation.iviteSent,
          currentConversation.lastActivity,
          currentConversation.offBoardedDate,
          currentConversation.trudiUserId
        ) !== userInviteStatusType.active
      );
    }
  }
}

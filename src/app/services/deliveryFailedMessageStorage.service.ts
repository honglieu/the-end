import { Injectable } from '@angular/core';
import {
  assign,
  defaultTo,
  uniq,
  map,
  filter,
  find,
  isEmpty,
  uniqBy
} from 'lodash-es';

export enum EStatusMessage {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryFailedMessageStorageService {
  private keyStorage = 'deliveryFailedMessages';
  constructor() {}

  private getLocalStorage() {
    return defaultTo(JSON.parse(localStorage.getItem(this.keyStorage)), []);
  }

  private setLocalStorage(value: any) {
    localStorage.setItem(this.keyStorage, JSON.stringify(value));
  }

  getVisibleDeliveryFail(conversationId: string) {
    return this.getDeliveryFailedMessage(conversationId).length > 0;
  }

  getDeliveryFailedMessageTaskIds() {
    return uniq(this.getLocalStorage().map((g) => g.taskId));
  }

  getDeliveryFailedMessageAll(conversationId: string) {
    return (
      map(
        filter(this.getLocalStorage(), (g) =>
          [g.body?.conversationId, g.message?.conversationId].includes(
            conversationId
          )
        )
      ) || []
    );
  }

  getDeliveryFailedMessage(conversationId: string) {
    return (
      map(
        filter(this.getLocalStorage(), (g) =>
          [g.body?.conversationId, g.message?.conversationId].includes(
            conversationId
          )
        ),
        'message'
      ) || []
    );
  }

  getDeliveryFailedBody(messageId: string) {
    const guild = find(this.getLocalStorage(), (g) =>
      [g?.body?.textMessage?.id, g.message?.id].includes(messageId)
    );
    return { body: guild?.body || {}, messageType: guild?.messageType || {} };
  }

  updateGuildBlockAction() {
    const storedDeliveryFailedMessages = this.getLocalStorage();

    const updatedMessages = map(storedDeliveryFailedMessages, (g) => ({
      ...g,
      action: false
    }));
    this.setLocalStorage(updatedMessages);
  }

  updateDeliveryFailedMessages(
    body,
    groupMessage,
    taskId,
    status,
    messageType
  ) {
    const storedDeliveryFailedMessages = this.getLocalStorage();

    const filteredMessages =
      status === EStatusMessage.SUCCESS
        ? filter(
            storedDeliveryFailedMessages,
            (message) =>
              message?.body?.textMessage?.id !== body?.textMessage?.id ||
              message?.body?.textMessages?.[0]?.id !==
                body?.textMessages?.[0]?.id
          )
        : storedDeliveryFailedMessages;

    const newErrorMessages =
      status === EStatusMessage.ERROR && body
        ? {
            messageType,
            body,
            taskId,
            message: this.createErrorMessage(
              body?.textMessage?.id || body?.textMessages?.[0]?.id || body?.id,
              groupMessage
            ),
            action: true
          }
        : {};

    const updatedMessages = filter(
      [...filteredMessages, newErrorMessages],
      (item) => !isEmpty(item)
    );
    this.setLocalStorage(
      uniqBy(
        updatedMessages,
        (e) => e.body?.textMessage?.id || e.body?.textMessages?.[0]?.id
      )
    );
  }

  createErrorMessage(messageId: string, groupMessage) {
    const todayGroupMessages = find(groupMessage, { timeStamp: 'Today' });
    const errorMessage = find(todayGroupMessages?.messages, {
      id: messageId
    });

    return assign({}, errorMessage, { isSending: false, isError: true });
  }
}

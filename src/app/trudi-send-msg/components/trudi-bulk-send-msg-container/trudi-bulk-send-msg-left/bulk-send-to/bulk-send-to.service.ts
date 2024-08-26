import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EMessageComeFromType, EUserPropertyType } from '@shared/enum';
import { IBulkSendToItem } from '@/app/trudi-send-msg/components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/bulk-send-to/bulk-send-to.component';
import { IGetListContactTypeResponse } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import {
  IConfirmRecipientContactGroupData,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, ValidatorFn } from '@angular/forms';
import { uniqBy } from 'lodash-es';
export const SUFFIX_INVALID_EMAIL_ID = '_invalid_email_id';

@Injectable()
export class ConvertContactTypesToRecipientsService {
  private _state: IContactTypeState[];
  private _taskData: ITasksForPrefillDynamicData[];
  private _contactTypeData: IGetListContactTypeResponse[];
  public bulkSendToControl: FormControl;

  constructor() {}

  buildBulkSendToControl() {
    this.bulkSendToControl = new FormControl([], [this.validateBulkSendTo()]); // include contact types and external emails
  }

  validateBulkSendTo(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const bulkSendToIds = control?.value || [];

      if (
        bulkSendToIds.some((item: string) =>
          item.toString().endsWith(SUFFIX_INVALID_EMAIL_ID)
        )
      ) {
        return { emailInvalid: true };
      }
      return null;
    };
  }

  initState(
    contactTypeData: IGetListContactTypeResponse[],
    taskData: ITasksForPrefillDynamicData[]
  ): void {
    if (!contactTypeData || !taskData) return;
    this._taskData = taskData;
    this._contactTypeData = contactTypeData;
    this._state = contactTypeData.map((contactData) => {
      const listReceiversUpdated = taskData?.flatMap((task) =>
        contactData.data.map((receiver) => {
          const conversations = task?.conversations?.filter(
            (conversation) =>
              conversation.conversationType === EMessageComeFromType.EMAIL &&
              conversation.participants?.some(
                (participant) => participant.user?.id === receiver.id
              ) &&
              conversation?.participants?.length === 1
          );

          return {
            ...receiver,
            isFromSelectRecipients: true,
            title: task.taskTitle || task.taskName,
            taskProperty: task.property,
            taskId: task.taskId,
            conversations: conversations,
            conversationId: conversations?.[0]?.id || null,
            participants: conversations?.[0]?.participants
          };
        })
      );

      const completeData = listReceiversUpdated.filter(
        (item) =>
          item.propertyId === item.taskProperty?.id ||
          item.taskId === item?.userTaskId
      );
      return {
        ...contactData,
        data: completeData
      } as unknown as IContactTypeState;
    });
  }

  /**
   *
   * @param externalEmailData
   * @param confirmRecipientsData previous value of confirm recipient's control array
   * @returns control array value of confirm recipients after remove some contact types or external email
   */
  addExternalEmail(
    externalEmailData: IBulkSendToItem[],
    confirmRecipientsData: IConfirmRecipientContactGroupData[]
  ): IConfirmRecipientContactGroupData[] {
    externalEmailData.forEach((externalEmail) => {
      const hasExternalEmail = this._state.find(
        (item) => item.id.toString() === externalEmail.id.toString()
      );
      if (!hasExternalEmail) {
        this._state = [
          ...this._state,
          externalEmail as unknown as IContactTypeState
        ];
      }

      confirmRecipientsData = confirmRecipientsData.map(
        (confirmRecipients) => ({
          ...confirmRecipients,
          recipients: getUniqConfirmRecipients([
            ...confirmRecipients.recipients,
            ...externalEmail.data.filter(
              (item) => item.taskId === confirmRecipients.taskId
            )
          ])
        })
      );
    });
    return confirmRecipientsData;
  }

  /**
   * You will need this function when you want to reset the data of confirmed recipients
   * and prefill certain contact types and external emails
   *
   * @param contactTypeIds
   * @param externalEmailsData
   * @returns control array value of confirm recipients after remove some contact types or external email
   */
  generateConfirmRecipientFirstTime(
    contactTypeIds: string[],
    externalEmailsData: IBulkSendToItem[]
  ): IConfirmRecipientContactGroupData[] {
    const recipientsOfTaskMapper = new Map();
    this._state
      .filter((item) =>
        contactTypeIds.some(
          (contactTypeId) => contactTypeId.toString() == item.id.toString()
        )
      )
      .forEach((item) => {
        item.data
          .filter(
            (recipient) => recipient.email || recipient.secondaryEmail?.email
          )
          .forEach((recipient) => {
            if (recipientsOfTaskMapper.has(recipient.taskId)) {
              recipientsOfTaskMapper.set(recipient.taskId, [
                ...recipientsOfTaskMapper.get(recipient.taskId),
                recipient
              ]);
            } else {
              recipientsOfTaskMapper.set(recipient.taskId, [recipient]);
            }
          });
      });

    const confirmRecipients = this._taskData.map((task) => ({
      taskId: task.taskId,
      propertyId: task.property.id,
      streetLine: task.property.streetLine || '',
      recipients: recipientsOfTaskMapper.has(task.taskId)
        ? recipientsOfTaskMapper.get(task.taskId)
        : []
    }));

    return externalEmailsData
      ? this.addExternalEmail(externalEmailsData, confirmRecipients)
      : confirmRecipients;
  }

  /**
   * @param contactTypeId
   * @param confirmRecipientsData previous value of confirm recipient's control array
   * @returns control array value of confirm recipients after remove some contact types or external email
   */
  addContactType(
    contactTypeId: string,
    confirmRecipientsData: IConfirmRecipientContactGroupData[]
  ): IConfirmRecipientContactGroupData[] {
    const recipients =
      this._state.find((item) => item.id.toString() == contactTypeId.toString())
        ?.data || [];
    return confirmRecipientsData.map((confirmRecipients) => {
      const completeRecipients = getUniqConfirmRecipients([
        ...confirmRecipients.recipients,
        ...recipients.filter(
          (recipient) =>
            recipient.taskId === confirmRecipients.taskId &&
            (recipient.email ||
              recipient.secondaryEmail?.id ||
              recipient.secondaryEmail?.email)
        )
      ]);
      return {
        ...confirmRecipients,
        recipients: completeRecipients
      };
    });
  }

  /**
   *
   * @param removeContactTypeIds items are deleted
   * @param selectedContactTypeIds selected contact types and external emails after remove some items
   * @param confirmRecipientsData previous value of confirm recipient's control array
   * @returns control array value of confirm recipients after remove some contact types or external email
   */
  removeContactTypes(
    removeContactTypeIds: string[],
    selectedContactTypeIds: string[],
    confirmRecipientsData: IConfirmRecipientContactGroupData[]
  ): IConfirmRecipientContactGroupData[] {
    const removeRecipients = this._state
      .filter((item) =>
        removeContactTypeIds.some(
          (removeId) => removeId.toString() === item.id.toString()
        )
      )
      .flatMap((item) => item.data);

    const selectedRecipients = this._state
      .filter((item) =>
        selectedContactTypeIds.some(
          (removeId) => removeId.toString() === item.id.toString()
        )
      )
      .flatMap((item) => item.data);

    const isSameRecipient = (a: ISelectedReceivers, b: ISelectedReceivers) =>
      a.id === b.id &&
      a.propertyId === b.propertyId &&
      (a.secondaryEmail?.id === b.secondaryEmail?.id ||
        a.secondaryEmail?.email === b.secondaryEmail?.email);

    const completeRemoveRecipients = removeRecipients.filter(
      (removeRecipient) =>
        !selectedRecipients.some((selectedRecipient) =>
          isSameRecipient(removeRecipient, selectedRecipient)
        )
    );

    return confirmRecipientsData.map((confirmRecipients) => {
      return {
        ...confirmRecipients,
        recipients: confirmRecipients.recipients.filter(
          (recipient) =>
            !completeRemoveRecipients.some((removeRecipient) =>
              isSameRecipient(removeRecipient, recipient)
            )
        )
      };
    });
  }

  /**
   *
   * @param recipient
   * @return The bulk send to items contains the recipient in the input parameter
   */
  getBulkSendToItemsByRecipient(recipient: ISelectedReceivers): string[] {
    if (recipient.type === EUserPropertyType.UNIDENTIFIED)
      return [recipient.id];
    return this._contactTypeData
      .filter((item) =>
        item.data?.some(
          (recipientInContactType) =>
            recipientInContactType.id === recipient.id &&
            recipientInContactType.propertyId === recipient.propertyId &&
            (recipientInContactType.secondaryEmail?.id ===
              recipient.secondaryEmail?.id ||
              recipientInContactType.secondaryEmail?.email ===
                recipient.secondaryEmail?.email)
        )
      )
      .map((item) => item.id.toString());
  }
}

interface IContactTypeState extends IGetListContactTypeResponse {}

export function getUniqConfirmRecipients<T extends ISelectedReceivers>(
  receiverData: T[],
  compareKeys: string[] = ['id', 'propertyId', 'secondaryEmail']
) {
  return uniqBy(receiverData, (item) => {
    return compareKeys
      .map((key) => {
        // item[key]?.id || item[key]?.email for case secondaryEmail
        return item[key]?.id || item[key]?.email || item[key] || '';
      })
      .join('_');
  });
}

import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { FormGroup } from '@angular/forms';
import { getDynamicByCrmSystem } from './ai-params-helper';
import { getIsSendBulk } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ECreateMessageFrom,
  EMutationChannel
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';

export function getGenerateEmailPayload(
  sendMsgForm: FormGroup,
  sendMsgConfigs: ISendMsgConfigs
) {
  const { property, selectedReceivers } = sendMsgForm?.value || {};
  const receiverUserIds = (selectedReceivers || []).map((item) => {
    return item.id || item.userId;
  });
  const isSendBulk = getIsSendBulk(sendMsgConfigs);
  return {
    conversationId: !sendMsgConfigs?.otherConfigs?.isCreateMessageType
      ? sendMsgConfigs?.serviceData?.conversationService?.currentConversation
          ?.id
      : '',
    propertyId: property?.id,
    receiverUserIds: receiverUserIds,
    isDynamicVariable: isSendBulk || !sendMsgConfigs
  };
}

export function updateEmail(email: string) {
  let draft = '';
  let isCompleted = false;
  try {
    const emailJson = JSON.parse(email);
    if (emailJson.hasOwnProperty('new_email_body')) {
      draft = emailJson.new_email_body;
      isCompleted = true;
    } else if (emailJson.hasOwnProperty('message')) {
      draft = emailJson.message;
      isCompleted = true;
    }
    draft = extractMarkdownContent(draft);
    return { draft, isCompleted };
  } catch (error) {}
  try {
    draft += extractFieldFromPartialJson(email, 'new_email_body');
    draft += extractFieldFromPartialJson(email, 'message');
    draft = extractMarkdownContent(draft);
  } catch (error) {}
  return { draft, isCompleted };
}

export function replaceParamVariables(text, crmSystem: ECRMSystem) {
  const variables = getDynamicByCrmSystem(crmSystem).reduce(
    (acc: string[], cur) => {
      return acc.concat(cur.menu.map((i) => i.param));
    },
    []
  );

  let modifiedText = text;
  const tag = text?.match(/\[(\$)?\w+\]/gim);
  tag?.forEach((item) => {
    const value = item.slice(1, item.length - 1);
    if (variables.includes(value)) {
      const regExp = new RegExp(
        `\\[${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`,
        'gim'
      );
      modifiedText = modifiedText.replace(
        regExp,
        `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${value}</span>`
      );
    }
  });
  return modifiedText;
}

function extractMarkdownContent(email: string): string {
  try {
    const start = email.indexOf('```markdown');
    if (start !== -1) {
      const end = email.indexOf('```', start + 11);
      if (end !== -1) {
        return email.slice(start + 11, end).trim();
      } else {
        return email.slice(start + 11).trim();
      }
    }
  } catch (error) {}
  return email.trim();
}

function extractFieldFromPartialJson(
  partialJson: string,
  field: string
): string {
  const fieldStart = `"${field}":"`;
  let fieldContent = '';

  const startIndex = partialJson.indexOf(fieldStart);
  if (startIndex !== -1) {
    const contentStartIndex = startIndex + fieldStart.length;
    let inEscape = false;

    for (let i = contentStartIndex; i < partialJson.length; i++) {
      const char = partialJson[i];
      if (inEscape) {
        if (char === 'n') fieldContent += '\n';
        else if (char === '"') fieldContent += '"';
        else if (char === '\\') fieldContent += '\\';
        else fieldContent += char;
        inEscape = false;
      } else {
        if (char === '\\') {
          inEscape = true;
        } else if (char === '"') {
          break;
        } else {
          fieldContent += char;
        }
      }
    }
  }

  return fieldContent;
}

export function focusElement(
  elementId: string,
  document: Document,
  parentElementId?: string
) {
  const parentElement = parentElementId
    ? document.querySelector(`#${parentElementId}`)
    : null;
  if (parentElement) {
    const childElement = parentElement.querySelector(elementId) as HTMLElement;
    childElement && childElement.focus();
  } else {
    const focusElement = document.querySelector(elementId) as HTMLElement;
    if (focusElement) {
      focusElement.focus();
    }
  }
}

export function focusAIElement(
  document: Document,
  sendMsgConfigs: ISendMsgConfigs
) {
  const inlineEditors = [
    ECreateMessageFrom.APP_MESSAGE,
    ECreateMessageFrom.MESSENGER,
    ECreateMessageFrom.SMS_MESSAGES,
    ECreateMessageFrom.WHATSAPP
  ];
  const parentId = inlineEditors.includes(
    sendMsgConfigs?.otherConfigs?.createMessageFrom
  )
    ? 'inlineEditor'
    : 'sendMessagePopup';
  const parentElement = parentId
    ? document.querySelector(`#${parentId}`)
    : document;
  const fontFamilyBtn = parentElement.querySelector('#fontFamilyBtn');
  if (!!fontFamilyBtn) {
    focusElement('#fontFamilyBtn', document, parentId);
    return;
  }
  const insertDynamic = parentElement.querySelector('#insertDynamic');
  if (!!insertDynamic) {
    focusElement('#insertDynamic', document, parentId);
    return;
  }
}

export function replaceAiTag(value: string) {
  return value.replace(/<[\w]{0,}>|<\/[\w]{0,}>/g, '');
}

export function removeTagSpace(value: string) {
  return value?.replace(/ /g, '').replace(/\n/g, '');
}

export function removeContentIgnore(container: HTMLDivElement) {
  const contentIgnore = [
    '#email-signature',
    '#select-user-greeting',
    '#sendMessageHiddenQuote'
  ];
  contentIgnore.forEach((ele) => {
    const removeElement = container.querySelector(ele);
    if (removeElement instanceof HTMLElement) {
      removeElement.innerText = '';
    }
  });
}

export function getMutationChannel(createMessageFrom: ECreateMessageFrom) {
  return [
    ECreateMessageFrom.APP_MESSAGE,
    ECreateMessageFrom.MESSENGER,
    ECreateMessageFrom.WHATSAPP,
    ECreateMessageFrom.SMS_MESSAGES
  ].includes(createMessageFrom)
    ? EMutationChannel.OTHER
    : EMutationChannel.EMAIL;
}

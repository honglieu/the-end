import { TaskType } from '@shared/enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISendMsgType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

export const defaultConfigsButtonAction = {
  'footer.buttons.nextTitle': 'Send',
  'footer.buttons.showBackBtn': false,
  'footer.buttons.sendType': ISendMsgType.BULK,
  'body.prefillReceivers': true,
  'body.receiverTypes': true,
  'body.tinyEditor.attachBtn.disabled': false,
  'body.tinyEditor.isShowDynamicFieldFunction': true,
  'body.receiver.prefillSelected': true,
  'body.isFromInlineMsg': true,
  'body.ticketId': null,
  'body.isReplyTicketOfConversation': null,
  'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
  'otherConfigs.filterSenderForReply': true,
  'otherConfigs.isForwardConversation': false,
  'otherConfigs.isCreateMessageType': false,
  'otherConfigs.isForwardOrReplyMsg': true,
  'otherConfigs.isAutoPrefillDocument': false,
  'otherConfigs.disabledAutoSimilarReply': false,
  'inputs.openFrom': TaskType.MESSAGE,
  'body.isUrgentTicket': false,
  'otherConfigs.filterSenderForReplyInTask': false
};

export const taskForwardConfigsButtonAction = {
  'header.hideSelectProperty': false,
  'header.title': null,
  'header.showDropdown': false,
  'body.prefillReceivers': false,
  'body.tinyEditor.isShowDynamicFieldFunction': true,
  'footer.buttons.nextTitle': 'Send',
  'footer.buttons.showBackBtn': false,
  'footer.buttons.disableSendBtn': false,
  'otherConfigs.isForwardConversation': true,
  'otherConfigs.isCreateMessageType': false,
  'otherConfigs.isForwardOrReplyMsg': true,
  'otherConfigs.filterSenderForReply': true,
  'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
  'otherConfigs.filterSenderForReplyInTask': false
};

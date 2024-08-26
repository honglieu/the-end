import { CallTypeEnum, TaskType } from '@shared/enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISendMsgType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EOptionSendMessage } from '@/app/user/utils/user.enum';

export const sendMsgConfigs = {
  state: false,
  id: '',
  propertyId: '',
  typeSend: EOptionSendMessage.SEND_IN_INBOX,
  modal: {
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK,
    'body.prefillReceivers': true,
    'body.receiverTypes': true,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.receiver.prefillSelected': true,
    'body.isFromInlineMsg': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'otherConfigs.filterSenderForReply': false,
    'otherConfigs.isForwardConversation': false,
    'otherConfigs.isCreateMessageType': true,
    'otherConfigs.isForwardOrReplyMsg': true,
    'inputs.openFrom': TaskType.MESSAGE
  }
};

export const callRequestConfigs = {
  state: false,
  typeCall: CallTypeEnum.voiceCall,
  user: null,
  callTo: '',
  listMobileNumber: [],
  featurePhone: false,
  featureVideo: false
};

export const upgradePlanConfigs = {
  state: false,
  stateRequestSend: false,
  plan: null
};

export const whiteListInUserInfoDrawer = [];

export const mappedProfileRole = {
  MEMBER: 'Team member',
  ADMIN: 'Administrator',
  OWNER: 'Owner'
};

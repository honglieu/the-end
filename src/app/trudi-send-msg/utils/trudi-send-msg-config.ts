import {
  ActionSendMsgDropdown,
  ESendMsgAction
} from '@/app/routine-inspection/utils/routineType';
import { trudiUserId } from '@services/constants';
import { PopupQueue } from '@/app/share-pop-up/services/navigate-pop-ups.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TargetFromFormMessage } from '@shared/types/user.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { EFooterButtonType, ISendMsgConfigs } from './trudi-send-msg.interface';

export const dropdownList: ActionSendMsgDropdown[] = [
  {
    id: 0,
    icon: '/assets/icon/time.svg',
    buttonIcon: '/assets/icon/fill-time.svg',
    action: ESendMsgAction.Schedule
  },
  {
    id: 1,
    icon: '/assets/icon/complete-icon-outline.svg', // icon display on dropdown
    buttonIcon: '/assets/icon/send-arrow.svg', // icon display on button
    action: ESendMsgAction.SendAndResolve
  },
  {
    id: 2,
    icon: '/assets/icon/send-arrow-blank.svg',
    buttonIcon: '/assets/icon/send-arrow.svg',
    action: ESendMsgAction.Send
  }
];

export const trudiInfo: TargetFromFormMessage[] = [
  {
    index: 0,
    id: trudiUserId,
    name: 'Trudi',
    avatar: 'assets/icon/trudi-logo.svg',
    title: 'Virtual Property Assistant'
  }
];

// ONLY for UI purposes and configs for difference flows, will not retain any component states
export const defaultConfigs: ISendMsgConfigs = {
  header: {
    icon: 'buildingsV2',
    title: 'Send message',
    closeIcon: 'closeBtn',
    showCloseBtn: true,
    showDropdown: false,
    hideSelectProperty: false,
    isPrefillProperty: true, // If value is true then send message will use property of current task
    viewRecipients: false
  },
  body: {
    tinyEditor: {
      attachBtn: {
        disabled: false,
        attachOptions: {
          disabledUpload: false,
          disabledCreateReiForm: false,
          disabledAddContact: false
        }
      },
      isShowDynamicFieldFunction: false
    },
    title: {
      maxCharacter: 75
    },
    isFromInlineMsg: false,
    receiver: {
      isShowContactType: false,
      prefillSelectedTypeItem: false
    },
    receiverTypes: null,
    prefillReceivers: true,
    prefillReceiversList: [],
    prefillMediaFiles: false,
    prefillTitle: '',
    contactCard: {
      required: false
    },
    timeSchedule: '',
    remiderSchedule: '',
    typeSendMsg: ESendMsgAction.Send,
    hasEmailSignature: true,
    isShowNegative: false,
    replyQuote: '',
    autoGenerateMessage: null,
    replyToMessageId: null,
    draftMessageId: null
  },
  footer: {
    buttons: {
      nextButtonType: EFooterButtonType.DROPDOWN,
      backTitle: 'Back',
      nextTitle: 'Confirm',
      dropdownList,
      showBackBtn: true,
      showConfirmRecipientBackBtn: false,
      sendType: '' // default for both bulk and v3
    }
  },
  otherConfigs: {
    isCreateMessageType: false,
    disabledReceivers: false,
    disabledTitle: false,
    filterSenderForReply: false,
    calendarEvent: {
      sendCalendarEvent: false,
      calendarEventId: null
    },
    isShareCalendarEvent: false, // Skip the files when the isShareCalendarEvent is equal to true because the ICS file is fake in the FE.
    createMessageFrom: null,
    isForwardConversation: false,
    isForwardOrReplyMsg: false,
    isReplyAction: false,
    isValidSigContentMsg: true,
    isFromDraftFolder: false,
    isScheduleForSend: false,
    isShowSecondaryEmail: false,
    openFromBulkCreateTask: false, //If true enable back button go back from select recipients to select option send msg modal
    isProspect: false,
    isStep: false,
    scheduleDraft: null,
    isSendForward: false,
    isShowGreetingContent: false,
    isShowGreetingSendBulkContent: false
  },
  inputs: {
    selectedTasks: null,
    selectedTasksForPrefill: null,
    conversations: null,
    listOfFiles: null,
    rawMsg: '',
    prefillVariables: null,
    openFrom: null,
    defaultBtnOption: null,
    typeMessage: null,
    listDynamicFieldData: [],
    prefillData: null,
    mailBoxIdFromCalender: '',
    listUser: null,
    isAppUser: false,
    isSyncedAttachment: true,
    threadId: null,
    attachmentSync: {},
    isInternalNote: false,
    reiformData: null,
    appendBody: false,
    isAppMessage: false,
    isSMSMessage: false,
    isMessengerMessage: false,
    isWhatsAppMessage: false
  },
  serviceData: {
    conversationService: {
      listConversationByTask: null,
      currentConversation: null
    },
    taskService: {
      currentTask: null
    },
    trudiService: {
      trudiResponse: null
    }
  }
};

export const receiverTypeAllowedPrefillAll = new Set([
  EUserPropertyType.TENANT,
  EUserPropertyType.LANDLORD
]);

export const popupQueue: PopupQueue = {
  0: { display: false, isDone: false, name: 'send msg' },
  1: { display: false, isDone: false, name: 'confirm close' }
};

/** @constant
    @type {Array<ECreateMessageFrom>}
    @description Send message modals where their payload bodies should be mapped and have taskId or conversationId
*/
export const CREATE_MESSAGE_TYPES_PREFILL_TASK_ID = [
  ECreateMessageFrom.MULTI_MESSAGES,
  ECreateMessageFrom.MULTI_TASKS,
  ECreateMessageFrom.TASK_HEADER
];

export const PREFIX_MSG_AI = 'Hello {receiver first name},\n\n';

export const USER_TYPE_UNNECESSARY_PROPERTY_ID = [
  EUserPropertyType.AGENT,
  EUserPropertyType.OTHER,
  EUserPropertyType.SUPPLIER,
  EUserPropertyType.EXTERNAL,
  EUserPropertyType.UNIDENTIFIED,
  EUserPropertyType.MAILBOX,
  EUserPropertyType.LEAD
];

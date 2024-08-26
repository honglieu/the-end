import {
  ActionSendMsgDropdown,
  ESendMsgAction
} from '@/app/routine-inspection/utils/routineType';
import { trudiUserId } from '@services/constants';
import { PopupQueue } from '@/app/share-pop-up/services/navigate-pop-ups.service';
import { TargetFromFormMessage } from '@shared/types/user.interface';
import { EFooterButtonType, IConfigs } from './out-of-office.interface';

export const dropdownList: ActionSendMsgDropdown[] = [
  {
    id: 0,
    icon: '/assets/icon/send-arrow-blank.svg',
    buttonIcon: '/assets/icon/send-arrow.svg',
    action: ESendMsgAction.Send
  },
  {
    id: 1,
    icon: '/assets/icon/complete-icon-outline.svg', // icon display on dropdown
    buttonIcon: '/assets/icon/send-arrow.svg', // icon display on button
    action: ESendMsgAction.SendAndResolve
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
export const defaultConfigs: IConfigs = {
  header: {
    icon: 'trudiAvt',
    title: 'Send message',
    closeIcon: 'smallCloseBlack',
    showDropdown: false
  },
  body: {
    tinyEditor: {
      attachBtn: {
        disabled: false,
        attachOptions: {
          disabledUpload: false,
          disabledCreateReiForm: true,
          disabledAddContact: false
        }
      }
    },
    receiverTypes: null,
    prefillReceivers: true,
    prefillReceiversList: [],
    prefillMediaFiles: false,
    prefillTitle: ''
  },
  footer: {
    buttons: {
      nextButtonType: EFooterButtonType.DROPDOWN,
      backTitle: 'Back',
      nextTitle: 'Confirm',
      dropdownList,
      showBackBtn: true,
      sendType: '' // default for both bulk and v3
    }
  },
  otherConfigs: {
    isCreateMessageType: false
  }
};

export const popupQueue: PopupQueue = {
  0: { display: false, isDone: false, name: 'send msg' },
  1: { display: false, isDone: false, name: 'confirm close' }
};

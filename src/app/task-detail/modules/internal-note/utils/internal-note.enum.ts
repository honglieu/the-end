import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';

export enum ENoteToolbarAction {
  MENTION = 'MENTION',
  ATTACH = 'ATTACH'
}

export enum ENoteToolbarTooltip {
  MENTION = 'Mention someone',
  ATTACH = 'Attachments'
}

export enum EFileType {
  FILE = 'file',
  VIDEO = 'video',
  PHOTO = 'photo',
  AUDIO = 'audio'
}

export enum ENoteType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  CARD = 'CARD'
}

export enum ENoteTypePayload {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  AROUND = 'AROUND'
}

export enum ENotePopup {
  INVALID_FILE = 'INVALID_FILE',
  ADD_CONTACT_CARD = 'ADD_CONTACT_CARD',
  ADD_REI_FORM = 'ADD_REI_FORM',
  ADD_FILE_CRM = 'ADD_FILE_CRM'
}

export const CRM_CHECK = {
  [ECRMSystem.PROPERTY_TREE]: 'Property Tree',
  [ECRMSystem.RENT_MANAGER]: 'Rent Manager'
};

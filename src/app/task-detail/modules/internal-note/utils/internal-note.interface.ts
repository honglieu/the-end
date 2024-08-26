import { IconType } from '@trudi-ui';
import { ENoteToolbarAction, ENoteToolbarTooltip } from './internal-note.enum';
import { OverlayPositionType } from '@services/constants';
import { IFile } from '@shared/types/file.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

export interface INoteToolbarBtn {
  action: ENoteToolbarAction;
  defaultIcon: keyof typeof IconType;
  selectedIcon: keyof typeof IconType;
  tooltip: ENoteToolbarTooltip;
  selected: boolean;
  popup?: INoteToolbarPopup;
}

export interface INoteToolbarPopup {
  position: OverlayPositionType;
  popupList?: any[];
}

export interface IListNoteGroup {
  date: string;
  notes: IInternalNote;
}
export interface IInternalNote {
  taskId: string;
  createdBy: MentionUser;
  metadata: IContactCard | null;
  id: string;
  text: string;
  type: string;
  updatedAt: string;
  createdAt: string;
  editAt: string;
  fileId: string | null;
  parentId: string | null;
  mentionUsers: MentionUser[];
  file: INoteDocument;
  isPmNote: boolean;
  isForward?: boolean;
  friendlyId?: string;
  isEditing?: boolean;
  createdUser?: MentionUser;
}

export interface IContactCard {
  id: string;
  type: string;
  email: string;
  title: string;
  address: string;
  lastName: string;
  firstName: string;
  landingPage: string;
  phoneNumber: string;
  mobileNumber: string | string[];
}
export interface INoteDocument {
  id: string;
  userId: string;
  name: string;
  size: string;
  mediaLink: string;
  fileTypeId: string;
  createdAt: string;
  updatedAt: string;
  thumbMediaLink: string | null;
  documentTypeId: string | null;
  fileTypeString?: string;
  fileIcon: string;
  linkVideo: string;
  fileType: {
    name: string;
  };
  isForward?: boolean;
  syncPTStatus?: string;
}

export interface MentionUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  googleAvatar: string;
  displayName?: string;
}

export interface IListNoteResponse {
  data: IInternalNote[];
  total: string;
}

export interface ISyncDocumentPayload {
  taskId: string;
  syncDocumentInput: {
    internalFileId: string;
    agencyId: string;
    syncPTType: string;
  };
}

export interface ICurrentViewNoteResponse {
  taskId: string;
  userId: string;
  internalNote: {
    id: string;
    friendlyId: string;
  };
  isExistInternalNote: boolean;
}

export interface IPayloadSendNote {
  text: string;
  files?: IFile[];
  contactCards?: ISelectedReceivers[];
  mentionUserIds: string[];
  taskId: string;
}

export interface IPayloadEditNote extends IPayloadSendNote {
  id: string;
}
export interface IEditNoteConfig {
  toolbar: boolean;
  character: boolean;
  height: string;
  width: string;
  focusOnInit: boolean;
}

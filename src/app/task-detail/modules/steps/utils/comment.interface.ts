import { IFile, SyncPropertyDocumentStatus } from '@/app/shared/types';
import { ECommentType } from './comment.enum';

export interface ICommentResponse {
  data: IComment[];
  length: number;
  previous: number | null;
  next: number | null;
}

export interface IComment {
  id: string;
  friendlyId: number;
  taskId: string;
  text: string;
  noteHeader: any;
  type: ECommentType;
  metadata: any;
  createdAt: string;
  editAt: any;
  createdUser: User;
  internalNoteMentions: InternalNoteMention[];
  children: Children[];
  internalNoteFile: IFile[];
  isNewComment?: boolean;
}

export interface InternalNoteMention {
  userId: string;
  user: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar: any;
  googleAvatar: string;
}

export interface Children {
  id: string;
  friendlyId: number;
  taskId: string;
  stepId: string;
  createdBy: string;
  text: any;
  noteHeader: any;
  fileId: string;
  parentId: string;
  type: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  editAt: any;
  createdUser: User;
  internalNoteFile: IFileComment;
  internalNoteMentions: any[];
}

export interface InternalNoteFile {
  id: string;
  name: string;
  size: any;
  mediaLink: string;
  thumbMediaLink: any;
  syncPTStatus: any;
  syncedByUserId: any;
  syncPTType: any;
  fileType: any;
}

export interface ICommentQueryParam {
  taskId: string;
  stepId: string;
  limit: number;
  friendlyId?: string;
  type?: string;
}

export interface ICommentRequest {
  taskId: string;
  stepId: string;
  text: string;
  id?: string;
  mentionUserIds: string[];
  files?: IFileComment[];
  contactCards?: any[];
}

export interface IFileComment {
  file?: File;
  id?: string;
  localThumb?: string;
  icon?: string;
  fileName: string;
  extension?: string;
  isSupportedVideo?: boolean;
  size: number;
  type: string;
  name: string;
  localId: string;
  uploaded?: boolean;
  canUpload?: boolean;
  mediaType?: string;
  mediaLink?: string;
  syncPTStatus?: SyncPropertyDocumentStatus;
  fileSize?: string;
  thumbMediaLink?: string;
  syncedByUserId?: any;
  syncPTType?: any;
  fileType?: any;
  title?: string;
  isInvalidFile?: boolean;
}

export interface IMention {
  id: string;
  text: string;
  value: string;
  image: string;
  firstName?: string;
  lastName?: string;
}

export interface IUpdateSyncStatusPayload {
  attachmentId: string;
  syncPTStatus: SyncPropertyDocumentStatus;
}

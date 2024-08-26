import { SyncPropertyDocumentStatus } from '@/app/shared/types';

export interface FileCarousel {
  id?: string;
  propertyDocumentId: string;
  mediaLink: string;
  thumbMediaLink: string;
  fileTypeName?: string;
  createdAt: string;
  fileName: string;
  fileType?: string;
  FileID?: string; // BE field
  fileTypeDot?: string;
  extension?: string;
  name?: string;
  isUnsupportedFile?: boolean;
}

export interface FileType {
  name: string;
  icon: string;
  id: string;
}

interface UserFile {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
}

export interface IFile extends File {
  fileName: string;
  fileSize: number;
  fileType?: FileType;
  id?: string;
  mediaLink?: string;
  fileUrl?: string;
  user?: UserFile;
  createdAt?: string;
  title: string;
  topicId: string;
  documentTypeId: string;
  icon?: string;
  thumbMediaLink: string;
  extension: string;
  name: string;
  error?: boolean;
  isSelected?: boolean;
  parentId?: string;
  localThumb?: string;
  FileID?: string; // BE field
  mediaType?: string;
  isSupportedVideo?: boolean;
  localId?: string;
  propertyId?: string;
  uploaded?: boolean;
  canUpload?: boolean;
  tempId?: string;
  syncPTStatus?: SyncPropertyDocumentStatus;
  isUnsupportedFile?: boolean;
}

export interface FileCustom extends File {
  icon?: string;
  fileName?: string;
  extension?: string;
}

export interface IFileType extends FileType {
  createdAt: string;
  icon: string;
  id: string;
  updatedAt: string;
}

export enum EAvailableFileIcon {
  Image = 'image.svg',
  Video = 'video.svg',
  PDF = 'pdf.svg',
  Doc = 'doc.svg',
  Audio = 'audio.svg',
  voiceMailAudio = 'voice-mail.svg',
  Other = 'question-mark.svg',
  Calendar = 'calendar-round.svg',
  Excel = 'excel.svg'
}

export enum EAvailableFileSquareIcon {
  Image = 'image-square.svg',
  Video = 'video-square.svg',
  PDF = 'pdf-square.svg',
  Doc = 'doc-square.svg',
  Audio = 'audio.svg',
  voiceMailAudio = 'voice-mail-square.svg',
  Other = 'question-mark-square.svg',
  Calendar = 'calendar-square.svg',
  Excel = 'excel-square.svg'
}

export enum EFileOrigin {
  voice_mail = 'VOICE_MAIL',
  email = 'EMAIL',
  chat = 'CHAT'
}

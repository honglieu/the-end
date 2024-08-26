import { REIFormDocumentStatus } from '@shared/enum/share.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { IPropertyDocument } from './message.interface';

export interface ReiFormLink {
  formInline: string;
  formLive: string;
  formDetail: FormDetail;
}

export interface ReiFormLinks {
  outSide: ReiFormLink[];
  inPopup: ReiFormLink[];
}

export interface ReiForm {
  id: number;
  name: string;
  templateCode: string;
  templateId: number;
  templateName: string;
  userName: string;
  status: string;
  private: boolean;
}

export interface S3Info {
  url: string;
  key: string;
  bucket: string;
}

export interface FormFileInfo {
  fileUrl: string;
  fileSize: number;
  fileName: string;
  contentType: string;
}

export interface FormDetail {
  id?: number;
  name?: string;
  parentId?: any;
  templateId?: number;
  templateName?: string;
  isFinalised?: boolean;
  isSigned?: boolean;
  isCompleted?: boolean;
  completedDateTime?: any;
  formFiles?: any[];
  signers?: REIFormSigner[];
  status?: REIFormDocumentStatus;
  updated?: number;
  created?: number;
  documentStatusTitle?: string;
}

export interface ReiFormWidget extends FormDetail {
  id: number;
  name: string;
  isFinalised: boolean;
  isSigned: boolean;
  isSigning: boolean;
  isCompleted: boolean;
  completedDateTime: Date;
  formFiles: FormFile[];
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
  mediaLink: string;
  trudiButtonAction?: string;
  propertyDocument?: IPropertyDocument;
}

export interface FormFiles {
  content_type: string;
  file_url: string;
  filename: string;
  id: number;
  user_id: string;
}

export interface ReiFormData extends FormDetail {
  conversationId?: string;
  s3Info?: S3Info;
  formFileInfo?: FormFileInfo;
  formDetail?: FormDetail;
  formFiles?: FormFiles[];
  conversationIds?: string[];
}

export interface FormFile {
  id: number;
  form_id: number;
  user_id: number;
  archive_name: any;
  filename: string;
  content_type: string;
  attachment: boolean;
  deleted: boolean;
  created: number;
  updated: number;
  index: number;
  s3key: string;
  pages: number;
  signees: any;
  file_url: string;
}
export interface REIFormSigner {
  name: string;
  email: string;
  propertyType: EUserPropertyType;
  isSigned: boolean;
  sentDateTime?: string;
  avatar: string;
}

export interface DownloadSignedFormDetail {
  pdfFile: any;
  url: string;
}

export interface REIFormState {
  documentStatus: boolean;
  formName: boolean;
}

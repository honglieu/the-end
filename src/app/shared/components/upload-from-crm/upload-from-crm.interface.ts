import { FileType, IFile } from '@shared/types/file.interface';
import { PageOptions } from '@shared/types/trudi.interface';

export enum ETabType {
  PROPERTY = 'Property',
  TENANCY = 'Tenancy',
  OWNERSHIP = 'Ownership'
}

export enum EUploadFileType {
  PHOTO = 'photo',
  VIDEO = 'video',
  IMAGE = 'image'
}

export interface IGetFilesRequest extends PageOptions {
  taskId: string;
  entityType: ETabType;
  propertyId: string;
}

export interface IFilesResponse {
  list: IFileFromCRM[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
export interface IFileFromCRM extends IFile {
  id?: string;
  name: string;
  size: number;
  propertyId: string;
  fileTypeId: string;
  mediaLink: string;
  documentTypeId: string;
  title: string;
  fileType: FileType;
  isSupportedVideo?: boolean;
  localThumb: string;
  isSelected?: boolean;
  syncedDate?: string;
}

export interface IEntityType {
  label: ETabType;
}

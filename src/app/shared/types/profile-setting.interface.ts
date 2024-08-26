import { ISelectedReceivers } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { LocalFile } from '@services/files.service';

export interface OutOfOffice {
  id?: number;
  firstDate?: string | Date;
  lastDate?: string | Date;
  message?: string;
  includeSignature?: boolean;
  listOfFiles?: MappingFiles[];
  pmOutOfOfficeDocuments?: File[];
  options?: string;
  selectedContactCard?: ISelectedReceivers[];
}

export interface ValidationField {
  id: string;
  status: boolean;
}

export interface MappingFiles {
  '0': LocalFile;
  icon: string;
  id: string;
  error?: boolean;
}

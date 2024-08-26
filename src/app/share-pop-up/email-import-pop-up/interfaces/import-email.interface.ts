import { EUserPropertyType } from '@shared/enum/user.enum';

export interface IEmailInfo {
  name?: string;
  email?: string;
  type?: EUserPropertyType;
  isPrimary?: boolean;
}

export interface IEmailImport {
  from: IEmailInfo;
  to: IEmailInfo[];
  cc: IEmailInfo[];
  property: {
    id: string;
    streetline: string;
  };
  subject: string;
  textContent: string;
  htmlContent: string;
  timestamp: Date;
  files: {
    id: string;
    content: string;
    fileType: string;
    fileName: string;
    size: number;
  }[];
}

export interface IEmailImportPayload extends IEmailImport {
  mailBoxId: string;
}

import { FileCarousel, IFile } from '@shared/types/file.interface';

export interface IMessageSummary {
  attachments: IFile[] | FileCarousel[];
  createdAt: string;
  messageId: string;
  messageSummaryTimeLine: string;
  messageType: string;
}

export interface ILoadFile {
  file: FileCarousel;
  selectedFileId: string;
  ignore?: boolean;
}

export enum EGenerateSummaryStatus {
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS'
}

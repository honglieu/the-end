import { Pipe, PipeTransform } from '@angular/core';
import {
  listAudioTypeDot,
  listImageTypeDot,
  listVideoTypeDot
} from '@services/constants';
import { EAvailableFileIcon } from '@shared/types/file.interface';

@Pipe({
  name: 'getFileIconType'
})
export class GetFileIconTypePipe implements PipeTransform {
  transform(fileName: string) {
    const fileExtension = this.getFileExtensionWithoutDot(fileName);
    const baseSrc = 'assets/images/icons/';
    let icon = EAvailableFileIcon.Other;
    if (fileExtension) {
      if (
        this.removeAllDot([
          ...listImageTypeDot,
          '.tif',
          '.tiff',
          '.bmp'
        ]).includes(fileExtension)
      ) {
        icon = EAvailableFileIcon.Image;
      }

      if (this.removeAllDot(listVideoTypeDot).includes(fileExtension)) {
        icon = EAvailableFileIcon.Video;
      }

      if (this.removeAllDot(listAudioTypeDot).includes(fileExtension)) {
        icon = EAvailableFileIcon.voiceMailAudio;
      }

      if (fileExtension === 'pdf') {
        icon = EAvailableFileIcon.PDF;
      }

      if (fileExtension === 'doc' || fileExtension === 'docx') {
        icon = EAvailableFileIcon.Doc;
      }

      if (['xls', 'xlsx', 'xlsm'].includes(fileExtension)) {
        icon = EAvailableFileIcon.Excel;
      }

      if (['ics', 'ical'].includes(fileExtension)) {
        icon = EAvailableFileIcon.Calendar;
      }
    }

    return baseSrc + icon;
  }

  removeAllDot(data: string[]) {
    return data?.map((item) => item.replace(/\./g, ''));
  }

  getFileExtensionWithoutDot(name: string): any {
    const dotPosition = name?.lastIndexOf('.');
    if (dotPosition > -1) {
      return name?.substring(dotPosition + 1).toLowerCase();
    }
  }
}

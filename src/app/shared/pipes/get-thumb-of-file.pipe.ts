import {
  listImageTypeDot,
  listVideoTypeDot,
  listAudioTypeDot
} from '@services/constants';
import { Pipe, PipeTransform } from '@angular/core';
import { EAvailableFileSquareIcon, IFile } from '@shared/types/file.interface';

@Pipe({
  name: 'getThumbOfFile'
})
export class GetThumbOfFilePipe implements PipeTransform {
  transform(file: IFile) {
    const fileName = file.fileName;
    const fileExtension = getFileExtensionWithoutDot(fileName);

    const baseSrc = 'assets/images/icons/';
    let icon: EAvailableFileSquareIcon | string =
      EAvailableFileSquareIcon.Other;

    function removeAllDot(data: string[]) {
      return data?.map((item) => item.replace(/\./g, ''));
    }

    function getFileExtensionWithoutDot(name: string): any {
      const dotPosition = name?.lastIndexOf('.');
      if (dotPosition > -1) {
        return name?.substring(dotPosition + 1).toLowerCase();
      }
    }

    if (fileExtension) {
      if (
        removeAllDot([...listImageTypeDot, '.tif', '.tiff', '.bmp']).includes(
          fileExtension
        )
      ) {
        icon =
          file.thumbMediaLink ||
          file.mediaLink ||
          file.localThumb ||
          baseSrc + EAvailableFileSquareIcon.Image;
      }

      if (removeAllDot(listVideoTypeDot).includes(fileExtension)) {
        icon =
          file.thumbMediaLink ||
          file.localThumb ||
          baseSrc + EAvailableFileSquareIcon.Video;
      }

      if (removeAllDot(listAudioTypeDot).includes(fileExtension)) {
        icon = baseSrc + EAvailableFileSquareIcon.voiceMailAudio;
      }

      if (fileExtension === 'pdf') {
        icon = file.thumbMediaLink || baseSrc + EAvailableFileSquareIcon.PDF;
      }

      if (fileExtension === 'doc' || fileExtension === 'docx') {
        icon = baseSrc + EAvailableFileSquareIcon.Doc;
      }

      if (['xls', 'xlsx', 'xlsm'].includes(fileExtension)) {
        icon = baseSrc + EAvailableFileSquareIcon.Excel;
      }

      if (['ics', 'ical'].includes(fileExtension)) {
        icon = baseSrc + EAvailableFileSquareIcon.Calendar;
      }
    }

    return icon === EAvailableFileSquareIcon.Other ? baseSrc + icon : icon;
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { FILE_VALID_TYPE, MAX_FILE_SIZE } from '@services/constants';
import { LocalFile } from '@services/files.service';
import { validateFileExtension } from '@shared/feature/function.feature';

@Pipe({ name: 'checkFileInvalid' })
export class CheckFileInvalid implements PipeTransform {
  transform(
    file: LocalFile,
    fileValidType: string[] = FILE_VALID_TYPE,
    maxFileSize: number = MAX_FILE_SIZE
  ): boolean {
    const fileCheck = file[0] ? file[0] : file;
    return (
      !validateFileExtension(fileCheck, fileValidType) ||
      +fileCheck?.size / 1024 ** 2 > maxFileSize
    );
  }
}

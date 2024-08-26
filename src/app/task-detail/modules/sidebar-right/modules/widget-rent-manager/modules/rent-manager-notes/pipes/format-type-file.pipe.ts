import { Pipe, PipeTransform } from '@angular/core';
import { FilesService } from '@services/files.service';

@Pipe({ name: 'formatTypeFile' })
export class FormatTypeFilePipe implements PipeTransform {
  constructor(private filesService: FilesService) {}
  transform(type) {
    return this.filesService.getFileTypeSlash(type);
  }
}

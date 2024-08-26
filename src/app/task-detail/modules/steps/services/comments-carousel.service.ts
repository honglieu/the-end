import { SUPPORTED_FILE_CAROUSEL } from '@/app/services/constants';
import { FilesService } from '@/app/services/files.service';
import { EFileExtension } from '@/app/shared';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommentsCarouselService {
  private filesService = inject(FilesService);

  mapToImageCarouselItem(file) {
    const fileType = this.filesService.getFileTypeDot(
      file?.name || file.fileName
    );
    const extension = this.filesService.getFileExtensionWithoutDot(
      file.fileName || file.name
    );
    return {
      ...file,
      extension,
      fileType
    };
  }

  filterSupportedCarouselFiles(item): boolean {
    return SUPPORTED_FILE_CAROUSEL.includes(item?.extension);
  }

  getThumbnailLink(file) {
    return !file?.thumbMediaLink && file?.extension === EFileExtension.PDF
      ? 'assets/icon/thumbnail-loading.svg'
      : file?.thumbMediaLink;
  }
}

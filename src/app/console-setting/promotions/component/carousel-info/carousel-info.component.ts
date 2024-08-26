import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import {
  FILES_CONTROL_ERROR_MESSAGE,
  IMAGE_TYPE_SUPPORT_CAROUSEL
} from '@/app/console-setting/promotions/utils/type';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { FilesService, LocalFile } from '@services/files.service';
import { FileUploadService } from '@services/fileUpload.service';
import { IFileUploadCarousel } from '@/app/console-setting/promotions/utils/promotions.interface';
import { listImageTypeDot } from '@services/constants';

@Component({
  selector: 'carousel-info',
  templateUrl: './carousel-info.component.html',
  styleUrls: ['./carousel-info.component.scss']
})
export class CarouselInfoComponent implements OnInit {
  @Input() formGroup: FormGroup;
  @Input() index: number;
  @Input() title: string;
  private unsubscribe = new Subject<void>();
  public isInValidSupportTypeOrTooLarge: boolean = false;
  public supportTypeFile = IMAGE_TYPE_SUPPORT_CAROUSEL;
  public FILES_CONTROL_ERROR_MESSAGE = FILES_CONTROL_ERROR_MESSAGE;
  public isFilesFormNotHasValue: boolean = false;
  public isShowCarouselImagePreview: boolean = false;
  public listFile = [];
  public fileUploadLocal;
  public currentFile: IFileUploadCarousel[];
  readonly acceptImageType = listImageTypeDot;

  get imageUrl() {
    return this.formGroup.get('image');
  }

  get description() {
    return this.formGroup.get('description');
  }

  get url() {
    return this.formGroup.get('url');
  }

  get urlDisplay() {
    return this.formGroup.get('urlDisplay');
  }

  get featureName() {
    return this.formGroup.get('featureName');
  }

  constructor(
    public promotionsService: PromotionsService,
    private cdr: ChangeDetectorRef,
    private filesService: FilesService,
    private fileUpload: FileUploadService
  ) {}

  ngOnInit(): void {
    this.isFilesFormNotHasValue = !this.imageUrl.value?.length;
    this.url.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (!res) {
          this.urlDisplay.patchValue('');
        }
      });
    this.currentFile = this.imageUrl.value?.length ? this.imageUrl.value : [];
  }

  handleGetListFile(event) {
    this.imageUrl.patchValue(event);
  }

  async handleUploadFileLocal(event) {
    const files = (Object.values(event.target.files) as LocalFile[]) || [];
    event.target.value = '';
    const filesArr = Object.values(files) as LocalFile[];
    this.handleFileUpload(filesArr)
      .then(() => {
        this.currentFile = [];
        this.fileUploadLocal = this.listFile;
        this.isShowCarouselImagePreview = true;
      })
      .finally(() => {});
  }
  async handleFileUpload(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.promotionsService.promotionUploadedFile.next(file);
      const { name, type, size, localThumb, isSupportedVideo } = file || {};

      const infoLink = await this.fileUpload.uploadFile(file);
      this.listFile.push({
        title: name,
        fileName: name,
        fileSize: size,
        fileType: type,
        mediaLink: infoLink?.Location,
        mediaType: this.filesService.getFileTypeSlash(file?.type),
        icon: this.filesService.getFileIcon(file?.name),
        propertyIds: [],
        localThumb,
        isSupportedVideo
      });
    }
  }

  onShowCarouselPreviewPopup($event) {
    if (this.imageUrl.value?.length) {
      this.isShowCarouselImagePreview = true;
    }
  }

  closeCarouselPreviewPopup() {
    this.isShowCarouselImagePreview = false;
  }

  handleFileNameExtension(fileName: string) {
    let fileNameTemplate;
    if (fileName?.length) {
      fileNameTemplate = this.splitFileNameAndExtension(fileName).map(
        (item) => {
          return `<span class='text-ellipsis'>${item}</span>`;
        }
      );
    } else {
      fileNameTemplate = [];
    }
    return fileNameTemplate.join('');
  }

  splitFileNameAndExtension(fileName) {
    if (!fileName) return fileName;
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const name = fileName.substring(0, lastDotIndex);
      const extension = fileName.substring(lastDotIndex + 1);
      return [name, `.${extension}`];
    }
    return [fileName, ''];
  }

  handleCloseFile() {
    this.imageUrl.patchValue([]);
    this.isFilesFormNotHasValue = true;
  }
}

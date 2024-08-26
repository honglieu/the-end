import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Pipe,
  PipeTransform,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE,
  listFileDisplayThumbnail
} from '@services/constants';
import { FilesService, LocalFile } from '@services/files.service';
import {
  processFile,
  validateFileExtension
} from '@shared/feature/function.feature';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { PhotoType } from '@shared/types/task.interface';
import { fileLimit } from 'src/environments/environment';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import uuidv4 from 'uuid4';
import { isEqual } from 'lodash-es';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';

@Component({
  selector: 'trudi-send-msg-file-v2',
  templateUrl: './trudi-send-msg-file-v2.component.html',
  styleUrls: ['./trudi-send-msg-file-v2.component.scss']
})
export class TrudiSendMsgFileV2Component
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild('attachmentFiles') attachmentFiles: ElementRef;
  showPopupInvalidFile = false;
  ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  FILE_VALID_TYPE = FILE_VALID_TYPE;
  fileLimit: number = fileLimit;
  isOverFileSize = false;
  isUnSupportFile = false;
  public listAttachMediaFiles: PhotoType[] = [];
  @Input() isPrefillMediaFiles: boolean = false;
  @Input() public isCollapsed: boolean = false;
  @Output() isCollapsedChange = new EventEmitter<boolean>();
  private unsubscribe = new Subject<void>();
  private shouldTrackChange = false;
  private observer: ResizeObserver;
  public visibleItems: number;
  private timeOut: NodeJS.Timeout = null;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private filesService: FilesService,
    private cdr: ChangeDetectorRef,
    private trudiSendMsgService: TrudiSendMsgService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isCollapsed']) {
      if (this.isCollapsed) {
        this.collapse();
      }
    }
  }

  ngAfterViewInit(): void {
    this.observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0 && this.isCollapsed) {
          this.updateVisibleFiles();
        }
      }
    });
    this.observer.observe(this.attachmentFiles?.nativeElement);
  }

  ngOnInit(): void {
    this.listOfFiles.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((files) => {
        if (files?.length > 0) {
          this.validateFile(files);
          this.handleUploadFiles();
        } else {
          this.trudiSendMsgFormService.isFilesValidate = true;
          this.isUnSupportFile = false;
          this.isOverFileSize = false;
          this.trackChangeFile();
        }
        this.expand();
      });
    if (this.listOfFiles.value?.length > 0) {
      this.listOfFiles.setValue(this.configFiles(this.listOfFiles.value));
    }
    if (this.attachMediaFiles.value?.length > 0) {
      this.attachMediaFiles.setValue(
        this.configFiles(this.attachMediaFiles.value)
      );
    }
    this.listAttachMediaFiles = this.attachMediaFiles.value;
    this.listAttachMediaFiles.map((item) => (item.checked = true));
  }

  trackChangeFile() {
    if (
      !this.shouldTrackChange &&
      this.trudiSendMsgService.configs?.value?.body?.draftMessageId
    ) {
      return;
    }

    if (
      !isEqual(
        this.trudiSaveDraftService.cacheListAttachment,
        this.listOfFiles.value
      ) &&
      this.listOfFiles.value
    ) {
      this.trudiSaveDraftService.triggerControlChange$.next(true);
      this.trudiSaveDraftService.cacheListAttachment = this.listOfFiles.value;
    }
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get listOfFiles() {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get attachMediaFiles(): AbstractControl {
    return this.sendMsgForm?.get('attachMediaFiles');
  }

  get totalFileNumber(): number {
    return this.listOfFiles?.value?.length + this.listAttachMediaFiles?.length;
  }

  getFileIcon(name: string) {
    return this.filesService.getFileIcon(name);
  }

  mapFilesUpload(filesUpload: LocalFile[]) {
    return filesUpload.map((fileUpload) => {
      const fileExtension = this.filesService.getFileExtension(
        fileUpload?.name
      );
      if (fileUpload?.type?.indexOf('video') > -1) {
        fileUpload.isSupportedVideo =
          listFileDisplayThumbnail.includes(fileExtension);
      }
      return {
        '0': fileUpload,
        icon: this.filesService.getFileIcon(fileUpload?.name)
      };
    });
  }

  configFiles(files: LocalFile[] | PhotoType[]) {
    let filesToCheck = files?.map((file) => {
      const updatedFile = file[0] ? file[0] : file;

      const {
        fileTypeDot,
        fileType,
        thumbMediaLink,
        mediaLink,
        thumbnail,
        isAttachmentWidget,
        localThumb,
        isSupportedVideo
      } = updatedFile || {};

      const mappedFileType =
        (typeof updatedFile.fileType === 'object' &&
        Object.keys(updatedFile.fileType).length > 0
          ? updatedFile.fileType.name
          : updatedFile.fileType) || '';

      const sourceThumbnail =
        (((fileTypeDot || fileType) === 'video' ||
          mappedFileType.indexOf('video') > -1) &&
          thumbMediaLink) ||
        ((fileTypeDot || fileType) === 'photo' ||
        mappedFileType.indexOf('image') > -1
          ? mediaLink || thumbnail
          : null);

      updatedFile.localThumb = isAttachmentWidget
        ? sourceThumbnail
        : localThumb || sourceThumbnail;

      updatedFile.isSupportedVideo = isSupportedVideo || !!thumbMediaLink;
      return updatedFile;
    });

    this.validateFile(filesToCheck);

    return filesToCheck;
  }

  validateFile(files: LocalFile[] | PhotoType[]) {
    if (!files?.length) {
      this.trudiSendMsgFormService.isFilesValidate = true;
      this.isUnSupportFile = false;
      this.isOverFileSize = false;
      return;
    }
    this.isUnSupportFile = files?.some(
      (item) => !validateFileExtension(item[0] || item, this.FILE_VALID_TYPE)
    );
    this.isOverFileSize = files?.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > MAX_FILE_SIZE
    );
    this.trudiSendMsgFormService.isFilesValidate = !(
      this.isUnSupportFile || this.isOverFileSize
    );
  }

  isInvalidFile(file: LocalFile) {
    const fileCheck = file[0] ? file[0] : file;
    return (
      !validateFileExtension(fileCheck, FILE_VALID_TYPE) ||
      fileCheck?.size / 1024 ** 2 > MAX_FILE_SIZE
    );
  }

  async handleUploadFileLocal(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (!files) return;
    const filesArr = Object.values(files) as LocalFile[];
    for (let index = 0; index < filesArr.length; index++) {
      const file = filesArr[index];
      const fileExtension = this.filesService.getFileExtension(file?.name);
      await processFile(file, fileExtension);
    }
    let filesUpload = [
      ...this.listOfFiles.value,
      ...this.mapFilesUpload(filesArr)
    ];
    this.listOfFiles.setValue(this.configFiles(filesUpload));
    this.cdr.markForCheck();
  }

  async handleUploadFiles() {
    this.listOfFiles.value?.forEach((file) => {
      if (!file.localId) {
        file.localId = uuidv4();
      }
      if (!file.uploaded) {
        file.uploaded = false;
      }
      const fileCheck = file[0] ? file[0] : file;
      file.canUpload =
        validateFileExtension(fileCheck, this.FILE_VALID_TYPE) &&
        fileCheck.size / 1024 ** 2 <= fileLimit;
      file.mediaType = this.filesService.getFileTypeSlash(
        fileCheck?.fileType?.name
      );
    });
    const listFileUpload = this.listOfFiles.value?.filter(
      (file) => !file.uploaded && file.canUpload
    );

    if (listFileUpload.length) {
      this.trudiSaveDraftService.isLoadingUploadFile = true;
      const listFileUploaded = await this.trudiSendMsgService.formatFiles(
        listFileUpload
      );
      this.trudiSaveDraftService.setListFileUploaded([
        ...this.trudiSaveDraftService.getListFileUploaded(),
        ...(listFileUploaded || [])
      ]);
      this.listOfFiles.value?.forEach(
        (file) =>
          listFileUpload.some((item) => item.localId === file.localId) &&
          (file.uploaded = true)
      );
      this.trudiSaveDraftService.isLoadingUploadFile = false;
      this.shouldTrackChange = true;
      this.cdr.detectChanges();
      if (this.isCollapsed) {
        this.updateVisibleFiles();
      }
    }
    if (listFileUpload.length === 0) return;
    this.trackChangeFile();
  }

  trackByItems(index: number, item: LocalFile) {
    return item?.lastModified;
  }

  removeFile(index: number, event: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const filesUpload = this.listOfFiles.value;
    const itemToRemove = filesUpload[index];
    this.trudiSaveDraftService.isLoadingUploadFile = true;
    filesUpload.splice(index, 1);
    if (itemToRemove) {
      const currentFileUploaded =
        this.trudiSaveDraftService.getListFileUploaded();
      const newUploadedFile = currentFileUploaded.filter(
        (one) => one.localId !== itemToRemove.localId
      );
      this.trudiSaveDraftService.setListFileUploaded(newUploadedFile);
    }
    this.listOfFiles.setValue(filesUpload);
    this.trudiSaveDraftService.isLoadingUploadFile = false;
    this.validateFile(filesUpload);
    if (itemToRemove.canUpload) {
      this.trudiSaveDraftService.triggerControlChange$.next(true);
    }
    this.updateVisibleFiles();
  }

  removeMediaFiles(index: number, event: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const filesUpload = this.listAttachMediaFiles;
    filesUpload.splice(index, 1);
    this.attachMediaFiles.setValue(filesUpload);
    this.validateFile(filesUpload);
    this.updateVisibleFiles();
  }

  public expand(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.isCollapsed = false;
    this.isCollapsedChange.emit(false);
    this.visibleItems = this.totalFileNumber;
    this.cdr.detectChanges();
  }

  public collapse() {
    this.cdr.detectChanges();
    this.updateVisibleFiles();
  }

  updateVisibleFiles() {
    clearTimeout(this.timeOut);
    this.timeOut = setTimeout(() => {
      const parentEle = this.attachmentFiles?.nativeElement;
      if (!parentEle) return;
      let visibleEle = this.countVisibleItems(parentEle);
      if (visibleEle !== this.visibleItems) {
        this.setVisibleItemsValue(visibleEle);
        visibleEle = this.countVisibleItems(parentEle);
        if (visibleEle !== this.visibleItems) {
          this.setVisibleItemsValue(visibleEle);
        }
      }
    }, 0);
  }

  setVisibleItemsValue(value: number) {
    if (
      this.visibleItems > this.totalFileNumber &&
      value === this.totalFileNumber
    )
      return;
    this.visibleItems = value;
    this.cdr.detectChanges();
  }

  countVisibleItems(parent) {
    const parentRect = parent.getBoundingClientRect();
    const childrenEle = Array.from(parent.children) as Element[];
    let visibleEle = 0;
    childrenEle.forEach((child) => {
      const childRect = child?.getBoundingClientRect();
      const result =
        childRect.left < parentRect.left ||
        childRect.right > parentRect.right ||
        childRect.top < parentRect.top ||
        childRect.bottom > parentRect.bottom;
      if (!result) visibleEle++;
    });
    return visibleEle;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.observer.disconnect();
    clearTimeout(this.timeOut);
  }
}

@Pipe({ name: 'removeFileExtension' })
export class RemoveFileExtensionPipe implements PipeTransform {
  transform(value: string, substring?: string): string {
    if (!substring) return value;
    const lastOccurence = value.lastIndexOf(substring);
    const isIdentical = value.slice(lastOccurence) === substring;
    return isIdentical ? value.slice(0, lastOccurence) : value;
  }
}

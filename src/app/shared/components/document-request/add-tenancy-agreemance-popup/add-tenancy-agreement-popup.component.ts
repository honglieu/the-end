import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { validateFileExtension } from '@shared/feature/function.feature';
import { FilesService } from '@services/files.service';
import { fileLimit } from 'src/environments/environment';
import { FileCustom } from '@shared/types/file.interface';

@Component({
  selector: 'app-document-request-add-tenancy-agreement-popup',
  templateUrl: './add-tenancy-agreement-popup.component.html',
  styleUrls: ['./add-tenancy-agreement-popup.component.scss']
})
export class DocumentRequestAddTenancyAgreementPopupComponent
  implements OnInit, OnDestroy
{
  @Input() show: boolean = false;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() addTenancyAgreementNext = new EventEmitter<FileCustom[]>();

  public filesSelected: FileCustom[] = [];
  public isValidFileUploadType = true;
  public overFileSize = false;
  private fileTypes: any;
  private unsubscribers = new Subject<void>();

  constructor(private fileService: FilesService) {}

  ngOnInit() {
    this.getListFileType();
  }

  getListFileType() {
    const listFileType = localStorage.getItem('listFileType');
    if (listFileType) {
      this.fileTypes = JSON.parse(listFileType);
    } else {
      this.fileService
        .getListFileTye()
        .pipe(takeUntil(this.unsubscribers))
        .subscribe((res) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    }
  }

  onFilesDropped($event) {
    if ($event.length === 1) {
      const [file] = $event;
      const fileSizeMb = file.size / 1024 ** 2;
      // const validFileType = validateFileExtension(file);
      // this.isValidFileUploadType = validFileType;
      // if(validFileType) {
      //   const fileType = this.fileTypes.find(el => el.name === this.getFileType(file));
      //   if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
      //     this.prepareFilesList($event);
      //     this.overFileSize = false;
      //   } else {
      //     this.overFileSize = true;
      //     this.selectedFile = null;
      //   }
      // }
    }
  }

  fileBrowseHandler($event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    const files = $event.target.files;
    if (files && files.length) {
      const [file]: FileCustom[] = files;
      const fileSizeMb = file.size / 1024 ** 2;
      const fileType = this.fileTypes.find(
        (el) => el.name === this.getFileType(file)
      );
      const validFileType = validateFileExtension(file);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.filesSelected = [...this.filesSelected, ...files];
          this.mapInfoFile(this.filesSelected[this.filesSelected.length - 1]);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
        }
      }
    }
  }

  mapInfoFile(file: FileCustom) {
    if (!file) return;
    file.icon = this.fileService.getFileIcon(file.name);
    file.fileName = this.fileService.getFileName(file.name);
    file.extension = this.fileService.getFileExtension(file.name);
  }

  removeFile(fileIdx: number) {
    this.filesSelected.splice(fileIdx, 1);
  }

  onNext() {
    this.addTenancyAgreementNext.next(this.filesSelected);
  }

  getFileType(file: FileCustom): string {
    const splitFileNameArray = file.name.split('.');
    const fileExtension = splitFileNameArray[splitFileNameArray.length - 1];

    if (fileExtension === 'avi') {
      return 'video/avi';
    }

    if (file.type) {
      return file.type;
    }
    return '';
  }

  onCloseModal() {
    this.isCloseModal.emit(true);
  }

  ngOnDestroy(): void {
    this.unsubscribers.next();
    this.unsubscribers.complete();
  }
}

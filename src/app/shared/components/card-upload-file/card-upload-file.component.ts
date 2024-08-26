import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { validateFileExtension } from '@shared/feature/function.feature';
import { fileLimit } from 'src/environments/environment';
@Component({
  selector: 'card-upload-file',
  templateUrl: './card-upload-file.component.html',
  styleUrls: ['./card-upload-file.component.scss']
})
export class CardUploadFileComponent implements OnChanges {
  @ViewChild('inputUploadfile') private inputUploadfile: ElementRef;
  @Output() isOpenFile = new EventEmitter<boolean>();
  @Output() handleRemove = new EventEmitter<any>();
  @Output() onFile = new EventEmitter<any>();
  @Input() file: any;
  @Input() titleContent = '';
  @Input() isSubmit = false;
  @Input() acceptType = [];
  @Input() fileRequired = true;
  public invalidPdf = false;
  public overFileSize = false;
  public unSupportFile = false;
  public fileSize: number;

  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    this.onChangeFile(changes);
  }

  onChangeFile(changes: SimpleChanges) {
    if (changes['file']?.currentValue) {
      this.file =
        changes['file']?.currentValue?.length === 0
          ? null
          : changes['file']?.currentValue;
      this.validateFile(this.file);
    }
  }

  validateFile(files) {
    this.unSupportFile = files?.some(
      (item) => !validateFileExtension(item, this.acceptType)
    );
    this.overFileSize = files?.some(
      (item) => item.size / 1024 ** 2 > fileLimit
    );
  }

  public openFile(status: boolean) {
    this.isOpenFile.next(status);
  }
  removeFile(item, index) {
    if (item.id === this.file[index]?.id) {
      this.validateFile(this.file);
      this.handleRemove.next(index);
    }
  }

  fileBrowseHandler(event: Event) {
    const file = (event.target as HTMLInputElement).files;
    this.onFile.emit(file);
  }

  triggerUploadFile() {
    this.inputUploadfile.nativeElement.click();
  }
}

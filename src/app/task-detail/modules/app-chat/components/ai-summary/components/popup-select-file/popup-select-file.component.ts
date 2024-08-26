import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'popup-select-file',
  templateUrl: './popup-select-file.component.html',
  styleUrls: ['./popup-select-file.component.scss']
})
export class PopupSelectFileComponent implements OnChanges {
  @Input() files;
  @Input() selectedFiles: Array<any> = [];

  @Output() onClose = new EventEmitter<void>();

  @Output() onSelectFile = new EventEmitter();

  @Output() onConfirm = new EventEmitter();

  public selectedFileIdLookup: Record<string, boolean> = {};

  public isDisableSelect = false;
  private _isChanges: boolean = false;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    const selectedFileIds = changes['selectedFiles']?.currentValue
      ?.filter((file) => Boolean(file.id))
      .map((file) => file?.id);
    if (selectedFileIds?.length) {
      this.selectedFileIdLookup = selectedFileIds?.reduce(
        (idLookup: Record<string, boolean>, fileId: string) => {
          fileId && (idLookup[fileId] = true);
          return idLookup;
        },
        {}
      );
      this._checkDisableSelect();
    }
  }

  public handleClose() {
    this.onClose.emit();
  }

  public handleConfirm() {
    if (this._isChanges) {
      const selectedFiles = this.files?.filter(
        (file) => this.selectedFileIdLookup[file?.id]
      );
      this.onConfirm.emit(selectedFiles);
    }
    this.handleClose();
  }

  public trackById(_, file) {
    return file.id;
  }

  public handleSelectFile(file) {
    const validateResult = this._validateBeforeSelect(file.id);

    if (!validateResult) return;

    this.selectedFileIdLookup[file.id] = !Boolean(
      this.selectedFileIdLookup[file.id]
    );
    this._isChanges = true;
    this._checkDisableSelect();
  }

  private _validateBeforeSelect(fileId) {
    const selectedFileIds = Object.keys(this.selectedFileIdLookup).filter(
      (key) => this.selectedFileIdLookup[key]
    );

    const incrementCount = this.selectedFileIdLookup[fileId] ? -1 : 1;
    const checkCount = selectedFileIds.length + incrementCount;
    return checkCount <= 5;
  }

  private _checkDisableSelect() {
    const selectedFileIds = Object.keys(this.selectedFileIdLookup).filter(
      (key) => this.selectedFileIdLookup[key]
    );
    this.isDisableSelect = selectedFileIds.length >= 5;
  }
}

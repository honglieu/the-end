import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'button-upload-file',
  templateUrl: './button-upload-file.component.html',
  styleUrls: ['./button-upload-file.component.scss']
})
export class ButtonUploadFileComponent implements OnInit {
  @Output() isOpenFile = new EventEmitter<boolean>();
  constructor() {}

  ngOnInit(): void {}

  public openFile(status) {
    // this.isShowAddFilesModal = true;
    this.isOpenFile.next(status);
  }
}

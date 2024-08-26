import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-document-request-quit-confirm',
  templateUrl: './quit-confirm.component.html',
  styleUrls: ['./quit-confirm.component.scss']
})
export class DocumentRequestQuitConfirmComponent implements OnInit {
  @Output() isCloseModal = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit() {}

  public onConfirm(status: boolean) {
    this.isCloseModal.next(status);
  }
}

import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'resolve-conversation-popup',
  templateUrl: './resolve-conversation-popup.component.html',
  styleUrls: ['./resolve-conversation-popup.component.scss']
})
export class ResolveConversationPopupComponent implements OnInit {
  @Output() onConfirm = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  public configs = {
    visible: true,
    title: 'Save conversation to notes',
    subtitle:
      'Do you wish to automatically save resolved conversations with tenants and owners to the property notes in Rent Manager, for record keeping?',
    okText: 'Yes, please',
    cancelText: 'No, thanks',
    closable: false,
    className: 'resolve-conversation'
  };
  constructor() {}

  ngOnInit(): void {}
  confirm() {
    this.onConfirm.emit();
  }

  cancel() {
    this.onCancel.emit();
  }
}

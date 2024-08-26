import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-popup-delete',
  templateUrl: './popup-delete.component.html',
  styleUrls: ['./popup-delete.component.scss']
})
export class PopupDeleteComponent implements OnInit {
  @Input() title: string;
  @Input() disable: boolean = false;
  @Output() onCancel = new EventEmitter<boolean>();
  @Output() onDelete = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit() {}

  public handleDelete() {
    this.onDelete.next(true);
  }

  public handleCancel() {
    this.onCancel.next(false);
  }
}

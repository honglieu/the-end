import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-edit-action-link-success',
  templateUrl: './create-edit-action-link-success.component.html',
  styleUrls: ['./create-edit-action-link-success.component.scss']
})
export class CreateEditActionLinkSuccessComponent implements OnInit {
  @Input() isCreate: boolean;
  @Input() isDelete: boolean;
  constructor() {}

  ngOnInit() {}
}

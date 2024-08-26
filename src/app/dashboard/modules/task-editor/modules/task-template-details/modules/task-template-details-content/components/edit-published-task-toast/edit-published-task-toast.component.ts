import { Component, OnInit } from '@angular/core';
import { Toast } from 'ngx-toastr';

@Component({
  selector: 'edit-published-task-toast',
  templateUrl: './edit-published-task-toast.component.html',
  styleUrls: ['./edit-published-task-toast.component.scss']
})
export class EditPublishedTaskToastComponent extends Toast {}

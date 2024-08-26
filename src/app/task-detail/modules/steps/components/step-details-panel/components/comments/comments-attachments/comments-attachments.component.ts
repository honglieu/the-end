import { Component, Input } from '@angular/core';

@Component({
  selector: 'comments-attachments',
  templateUrl: './comments-attachments.component.html',
  styleUrl: './comments-attachments.component.scss'
})
export class CommentsAttachmentsComponent {
  @Input() invalidFile = {
    unSupportFile: false,
    overFileSize: false
  };
}

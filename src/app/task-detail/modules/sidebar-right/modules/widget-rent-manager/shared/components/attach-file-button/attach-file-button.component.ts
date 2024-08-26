import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/popup-management.service';
import { ERentManagerNotesPopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';

@Component({
  selector: 'attach-file-button',
  templateUrl: './attach-file-button.component.html',
  styleUrls: ['./attach-file-button.component.scss']
})
export class AttachFileButtonComponent implements OnInit {
  @Input() listFileAttached = [];
  @Input() disableRemoveButton = false;
  @Input() disableTooltipText: string = '';
  @Input() showFileSize: boolean = true;
  @Output() updateListFileAttached = new EventEmitter();
  constructor(private popupManagementService: PopupManagementService) {}

  ngOnInit(): void {}

  handleAttachFile() {
    this.popupManagementService.setCurrentPopup(
      ERentManagerNotesPopup.ATTACH_FILE
    );
  }
  removeFile(index: number) {
    this.listFileAttached.splice(index, 1);
    this.updateListFileAttached.emit(this.listFileAttached);
  }
}

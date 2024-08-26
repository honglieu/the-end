import { Component, OnInit } from '@angular/core';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/popup-management.service';
import { ERentManagerNotesPopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { filterOutUnwantedKeys } from '@shared/feature/function.feature';
import { HISTORY_NOTES_FILE_VALID_TYPE } from '@services/constants';
import { FilesService } from '@services/files.service';
import { TaskService } from '@services/task.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { RentManagerNotesService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes.service';
import { UserService } from '@services/user.service';

@Component({
  selector: 'attach-file-popup',
  templateUrl: './attach-file-popup.component.html',
  styleUrls: ['./attach-file-popup.component.scss']
})
export class AttachFilePopupComponent implements OnInit {
  constructor(
    private filesService: FilesService,
    public taskService: TaskService,
    private popupManagementService: PopupManagementService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private agencyDateFormatService: AgencyDateFormatService,
    private fb: FormBuilder,
    private rentManagerNotesService: RentManagerNotesService,
    private userService: UserService
  ) {}

  public rmNoteForm: FormGroup;
  public hasFileSelected: boolean = true;
  public listFile = [];
  public isChangeForm: boolean = false;
  public MAX_NUMBER_FILES = 5;
  public isInvalidNumberFiles: boolean = false;
  public dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public attachments = [];
  public isRMSyncing: boolean = false;
  public FILE_VALID_TYPE = HISTORY_NOTES_FILE_VALID_TYPE;

  ngOnInit(): void {
    this.isRMSyncing = this.rentManagerNotesFormService.disabled;
    this.rmNoteForm = this.rentManagerNotesFormService.form;
    const taskId = this.taskService.currentTaskId$.value;
    this.filesService.getAttacmentsByTask(taskId).subscribe((res) => {
      const data = res?.documents.filter(
        (item) => item.propertyDocuments.length > 0
      );
      data.forEach((item) => {
        item?.propertyDocuments.forEach((file) => {
          this.attachments.push({ ...file, isSelected: false });
        });
      });
    });
  }

  getListFile(files) {
    this.listFile = files.map((file) => {
      if (file.isSelected == false) return file;
      return {
        ...file,
        isSelected: true,
        user: this.userService.getUserInfo()
      };
    });
  }

  handleAttachFile() {
    const listFileSelected = [...this.attachments, ...this.listFile].filter(
      (file) => file.isSelected
    );
    if (
      listFileSelected.length <= this.MAX_NUMBER_FILES &&
      listFileSelected.length > 0
    ) {
      const fileControl = this.rmNoteForm.get('file') as FormArray;
      this.listFile.forEach((file) => {
        if (file.isSelected) {
          fileControl.push(
            this.fb.control(
              filterOutUnwantedKeys(
                {
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fileType: file.fileType,
                  mediaLink: file.mediaLink,
                  metaTag: file.metaTag || file.fileName,
                  icon: file.icon,
                  fileId: null,
                  historyAttachmentId: file.historyAttachmentId || null,
                  historyId: file.historyId || null
                },
                [null, undefined, NaN]
              )
            )
          );
        }
      });

      this.attachments.forEach((file) => {
        if (file.isSelected) {
          fileControl.push(
            this.fb.control(
              filterOutUnwantedKeys(
                {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.fileType.name,
                  mediaLink: file.mediaLink,
                  metaTag: file.metaTag || file.name,
                  icon: file.fileType.icon,
                  fileId: null,
                  historyAttachmentId: file.historyAttachmentId || null,
                  historyId: file.historyId || null
                },
                [null, undefined, NaN]
              )
            )
          );
        }
      });
      this.popupManagementService.setCurrentPopup(
        ERentManagerNotesPopup.SYNC_NOTES
      );
    } else if (listFileSelected.length > this.MAX_NUMBER_FILES) {
      this.isInvalidNumberFiles = true;
      this.hasFileSelected = true;
    } else {
      this.isInvalidNumberFiles = false;
      this.hasFileSelected = false;
    }
  }
  handleCheckboxFileAttach(i) {
    this.attachments[i].isSelected = !this.attachments[i].isSelected;
  }
  handleCheckboxFileLocal(i) {
    this.listFile[i].isSelected = !this.listFile[i].isSelected;
  }

  handleBack() {
    this.popupManagementService.setCurrentPopup(
      ERentManagerNotesPopup.SYNC_NOTES
    );
  }
  handleAfterClose() {
    this.popupManagementService.setCurrentPopup(null);
    this.rentManagerNotesService.setIsShowBackBtnBS(false);
    this.rentManagerNotesFormService.initData(null);
    this.rentManagerNotesFormService.initDataSelectNoteRequestForm(null);
  }
}

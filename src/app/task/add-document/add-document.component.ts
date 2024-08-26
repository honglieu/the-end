import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ApiService } from '@services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertiesService } from '@services/properties.service';
import { fileLimit, properties } from 'src/environments/environment';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { PopupService } from '@services/popup.service';
import { UserService } from '@services/user.service';
import { validateFileExtension } from '@shared/feature/function.feature';
import { IPersonalInTab } from '@shared/types/user.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'app-add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class AddDocumentComponent implements OnInit, OnDestroy {
  @ViewChild('contentSection') contentSection: ElementRef;
  @Output() isCloseModal = new EventEmitter<any>();
  @Input() editingFile: any;
  @Input() show: boolean;
  public currentProperty: any;
  public fileTypes: any;
  public overFileSize = false;
  public selectedFile: any;
  public selectTopicItems;
  public addFileForm: FormGroup;
  public listUserPropertyGroup: IPersonalInTab;
  private subscribers = new Subject<void>();
  private checkedList = [];
  private checkedGroup = [];
  public timeUpload: number;
  isValidFileUploadType = true;

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  constructor(
    private apiService: ApiService,
    private propertyService: PropertiesService,
    private fb: FormBuilder,
    private fileUpload: FileUploadService,
    public fileService: FilesService,
    private popupService: PopupService,
    public userService: UserService,
    private ref: ChangeDetectorRef,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges() {
    if (this.show) {
      this.getListDocumentType();
      this.getListFileType();
    }
  }

  ngOnInit() {
    this.initForm();
    this.propertyService.peopleList$
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.listUserPropertyGroup = res;
          this.generateCheckList();
          this.mapUserStatus();
        }
      });
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
        }
      });

    this.popupService.isShowAddFileArea.subscribe((res) => {
      this.ref && this.ref.markForCheck();
      if (res && res.display && !res.resetField && this.editingFile) {
        this.generateCheckList();
        this.setTopic(this.editingFile.documentTypeId);
        this.setTitle(this.editingFile.title);
        if (this.editingFile.userPropertyFilePermissions.length) {
          this.checkedGroup.forEach((value, index) => {
            if (
              this.editingFile.userPropertyFilePermissions.some(
                (el) => el.userProperty.id === value.userPropertyId
              )
            ) {
              value.checked = true;
              this.checkedList[index].checked = true;
            }
          });
        }
        this.mapInfoFile(this.editingFile);
      }
      if (res && res.display && res.resetField) {
        this.editingFile = null;
        this.selectedFile = null;
        this.resetAddFileForm();
      }
    });
    window.loader.ajaxindicatorstop();
  }

  sortData(userPropertyGroup) {
    return (
      userPropertyGroup &&
      userPropertyGroup.sort(
        (userGroup1, userGroup2) => userGroup1.type - userGroup2.type
      )
    );
  }

  getListFileType() {
    if (!localStorage.getItem('listFileType')) {
      this.apiService
        .getAPI(properties, 'list-of-filetype')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    } else {
      this.fileTypes = JSON.parse(localStorage.getItem('listFileType'));
    }
  }

  getListDocumentType() {
    if (!localStorage.getItem('listDocumentType')) {
      this.apiService
        .getAPI(properties, 'list-of-documenttype')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          if (res) {
            localStorage.setItem('listDocumentType', JSON.stringify(res));
            const table = [];
            const fulllistofConversationCategory = res;
            fulllistofConversationCategory.forEach((el) => {
              table.push({
                id: el.id,
                text: el.name
              });
            });
            this.selectTopicItems = table;
          }
        });
    } else {
      const table = [];
      const fulllistofConversationCategory = JSON.parse(
        localStorage.getItem('listDocumentType')
      );
      fulllistofConversationCategory.forEach((el) => {
        table.push({
          id: el.id,
          text: el.name
        });
      });
      this.selectTopicItems = table;
    }
  }

  initForm() {
    this.addFileForm = this.fb.group({
      topic: this.fb.control('', Validators.required),
      title: this.fb.control('', [
        Validators.required,
        Validators.maxLength(32)
      ])
    });
  }

  resetAddFileForm() {
    this.addFileForm.reset({
      topic: '',
      titleText: ''
    });
    this.selectedFile = null;
    this.editingFile = null;
    this.overFileSize = false;
    this.timeUpload = 0;
    this.generateCheckList();
  }

  topicChanged(event) {
    if (event) {
      this.addFileForm.get('topic').setValue(event);
    }
  }

  titleChanged(event) {
    if (event) {
      this.addFileForm.get('titleText').setValue(event);
    }
  }

  onOfValidator(group: FormGroup): any {
    if (group) {
      if (!group.get('landlord').value && !group.get('tenant').value) {
        return { needToHaveOne: true };
      }
    }

    return null;
  }

  generateCheckList() {
    this.checkedList = [];
    this.checkedGroup = [];
    this.timeUpload = 0;
    if (this.listUserPropertyGroup) {
      this.listUserPropertyGroup.ownerships.forEach((userPropertyGroup) => {
        userPropertyGroup.userProperties.forEach((userProperty) => {
          this.checkedList.push({
            id: 'cb-' + userProperty.id + '-filearea',
            groupId: userPropertyGroup.id,
            checked: false,
            isPropertyManagerCheck: false
          });
          this.checkedGroup.push({
            userPropertyId: userProperty.id,
            groupId: userPropertyGroup.id,
            checked: false,
            isPropertyManagerCheck: false
          });
        });
      });
      this.listUserPropertyGroup.tenancies.forEach((userPropertyGroup) => {
        userPropertyGroup.userProperties.forEach((userProperty) => {
          this.checkedList.push({
            id: 'cb-' + userProperty.id + '-filearea',
            groupId: userPropertyGroup.id,
            checked: false,
            isPropertyManagerCheck: false
          });
          this.checkedGroup.push({
            userPropertyId: userProperty.id,
            groupId: userPropertyGroup.id,
            checked: false,
            isPropertyManagerCheck: false
          });
        });
      });
      this.listUserPropertyGroup.propertyManagers?.forEach(
        (propertyManager) => {
          this.checkedList.push({
            id: 'cb-' + propertyManager.id + '-filearea',
            groupId: propertyManager.id,
            checked: true,
            isPropertyManagerCheck: true
          });
          this.checkedGroup.push({
            userPropertyId: propertyManager.id,
            groupId: propertyManager.id,
            checked: true,
            isPropertyManagerCheck: true
          });
        }
      );
      // if (this.listUserPropertyGroup.propertyManager) {
      //   this.checkedList.push({
      //     id: 'cb-' + this.listUserPropertyGroup.propertyManager.id + '-filearea',
      //     groupId: this.listUserPropertyGroup.propertyManager.id,
      //     checked: true,
      //     isPropertyManagerCheck: true
      //   });
      //   this.checkedGroup.push({
      //     userPropertyId: this.listUserPropertyGroup.propertyManager.id,
      //     groupId: this.listUserPropertyGroup.propertyManager.id,
      //     checked: true,
      //     isPropertyManagerCheck: true
      //   });
      // }
    }
  }

  isChecked(idRow: string) {
    const id: string = 'cb-' + idRow + '-filearea';
    const item = this.checkedList.find((i) => i.id === id);
    return item ? item.checked : false;
  }

  isGroupChecked(groupId: string) {
    return this.checkedList.some((el) => el.groupId === groupId && el.checked);
  }

  onCheckboxChange(userPropertyId: string) {
    const id: string = 'cb-' + userPropertyId + '-filearea';
    this.checkedList.forEach((item, index) => {
      if (item.id === id) {
        item.checked = !item.checked;
        if (this.checkedGroup) {
          this.checkedGroup[index].checked = !this.checkedGroup[index].checked;
        }
      }
    });
  }

  getCheckboxAllDisplay() {
    if (this.isAllChecked()) {
      return '/assets/icon/checkbox-on.svg';
    }

    return '/assets/icon/checkbox-off.svg';
  }

  isAllChecked() {
    return !this.checkedList.some((el) => !el.checked);
  }

  onCheckboxAllChange(event) {
    if (event.target.checked) {
      this.checkedList = this.checkedList.map((el) => {
        return { ...el, checked: true };
      });
      this.checkedGroup = this.checkedGroup.map((el) => {
        return { ...el, checked: true };
      });
    } else if (!event.target.checked) {
      this.checkedList = this.checkedList.map((el) => {
        if (!el.isPropertyManagerCheck) {
          return { ...el, checked: false };
        }
        return { ...el };
      });
      this.checkedGroup = this.checkedGroup.map((el) => {
        if (!el.isPropertyManagerCheck) {
          return { ...el, checked: false };
        }
        return { ...el };
      });
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  prepareFilesList(file: Object) {
    this.timeUpload = Date.now();
    this.selectedFile = file;
    this.mapInfoListFile(this.selectedFile);
  }

  getMimeTypes() {
    return this.fileTypes
      ? this.fileTypes.map((type) => type.name).toString()
      : null;
  }

  onFilesDropped($event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    if ($event.length === 1) {
      const [file] = $event;
      const fileSizeMb = file.size / 1024 ** 2;
      const validFileType = validateFileExtension(file);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        const fileType = this.fileTypes.find(
          (el) => el.name === this.getFileType(file)
        );
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.prepareFilesList($event);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
          this.selectedFile = null;
        }
      }
    }
  }

  fileBrowseHandler($event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    if ($event.target.files && $event.target.files.length) {
      this.isValidFileUploadType = false;
      const [file] = $event.target.files;
      const fileSizeMb = file.size / 1024 ** 2;
      const fileType = this.fileTypes.find(
        (el) => el.name === this.getFileType(file)
      );
      const validFileType = validateFileExtension(file);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.prepareFilesList($event.target.files);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
          this.selectedFile = null;
        }
      }
    }
  }

  getFileType(file): string {
    const splitFileNameArray = file.name.split('.');
    const fileExtension = splitFileNameArray[splitFileNameArray.length - 1];
    if (fileExtension === 'avi') {
      return 'video/avi';
    }
    if (file.type) {
      return file.type;
    }
    return '';
  }

  onEdit() {
    window.loader.ajaxindicatorstart('file editing');
    const userPropertyIds = [];
    this.checkedGroup.forEach((el) => {
      if (el.checked) {
        userPropertyIds.push(el.userPropertyId);
      }
    });
    const body = {
      propertyDocumentId: this.editingFile.id,
      userPropertyIds,
      title: this.title.value,
      documentTypeId: this.topic.value
    };

    this.fileService
      .updatePropertyDocument(body)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.fileService.reloadAttachments.next(true);
          this.isOpenAddFileModal(false);
          this.fileService.reloadAttachments.next(false);
          this.resetAddFileForm();
        }
        window.loader.ajaxindicatorstop();
      });
  }

  async onSend2() {
    window.loader.ajaxindicatorstart('File uploading');
    const userPropertyIds = [];
    this.checkedGroup.forEach((el) => {
      if (el.checked) {
        userPropertyIds.push(el.userPropertyId);
      }
    });
    const data = await this.fileUpload.uploadFile2(
      this.selectedFile[0],
      this.currentProperty.id
    );
    this.propertyService
      .addFile2(
        this.currentProperty.id,
        this.selectedFile[0].name,
        this.selectedFile[0].size,
        this.selectedFile[0].type,
        data.Location,
        userPropertyIds,
        this.topic.value,
        this.title.value
      )
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res && res.id && res.mediaLink) {
          this.fileService.reloadAttachments.next(true);
          this.isOpenAddFileModal(false);
          this.fileService.reloadAttachments.next(false);
          this.resetAddFileForm();
        }
        window.loader.ajaxindicatorstop();
      });
  }

  cancel() {
    this.isCloseModal.emit(false);
  }

  public isOpenAddFileModal(status) {
    this.isValidFileUploadType = true;
    if (!status) {
      this.selectedFile = null;
      this.editingFile = null;
      this.isCloseModal.next(status);
      this.contentSection.nativeElement.scrollTop = 0;
    }
  }

  get topic() {
    return this.addFileForm.get('topic');
  }

  setTopic(value: string) {
    this.topic.setValue(value);
  }

  get title() {
    return this.addFileForm.get('title');
  }

  setTitle(value: string) {
    this.title.setValue(value);
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      this.mapInfoFile(fileList[index]);
    }
  }

  mapInfoFile(file) {
    if (!file) return;
    file.icon = this.fileService.getFileIcon(file.name);
    file.fileName = this.fileService.getFileName(file.name);
    file.extension = this.fileService.getFileExtension(file.name);
  }

  mapUserStatus() {
    this.listUserPropertyGroup?.ownerships?.forEach((item) => {
      if (!item.userProperties) return;
      item.userProperties = item.userProperties.map((u) => {
        if (u.user) {
          u.user.statusInvite = this.userService.getStatusInvite(
            u.user.iviteSent,
            u.user.lastActivity,
            u.user.offBoardedDate,
            u.user.trudiUserId
          );
        }
        return u;
      });
    });
    this.listUserPropertyGroup?.tenancies?.forEach((item) => {
      if (!item.userProperties) return;
      item.userProperties = item.userProperties.map((u) => {
        if (u.user) {
          u.user.statusInvite = this.userService.getStatusInvite(
            u.user.iviteSent,
            u.user.lastActivity,
            u.user.offBoardedDate,
            u.user.trudiUserId
          );
        }
        return u;
      });
    });
  }
}

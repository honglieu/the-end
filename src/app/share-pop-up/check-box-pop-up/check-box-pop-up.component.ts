import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '@services/api.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE
} from '@services/constants';
import { FilesService, LocalFile } from '@services/files.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import {
  processFile,
  validateFileExtension
} from '@shared/feature/function.feature';
import { EAvailableFileIcon, IFileType } from '@shared/types/file.interface';
import { fileLimit, properties } from 'src/environments/environment';
import { cloneDeep } from 'lodash-es';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import uuid4 from 'uuid4';
const defaultText = {
  back: 'Back',
  next: 'Next',
  overSize: 'Your file is larger than 25MB. Please upload a smaller file.',
  unSupported: 'Unsupported file type.',
  notFound: 'No attachments found in this task',
  header: 'Which PDF attachments would you like to send to the landlord?',
  upload: 'Upload File'
};

export enum ECheckboxMode {
  Single = 'Single',
  Multi = 'Multi'
}

export enum ECheckBoxType {
  Tick = 'Tick',
  Radio = 'Radio'
}

export enum EOptionType {
  File = 'File',
  Option = 'Option'
}

export enum EOptionalButton {
  UploadFile = 'UploadFile'
}

const checkBoxImg = {
  Radio: {
    checked: '/assets/icon/checkbox-circle-checked-primary.svg',
    uncheck: '/assets/icon/blank-uncheck.svg'
  },
  Tick: {
    checked: '/assets/icon/ownership-check.svg',
    uncheck: '/assets/icon/select-people-uncheck.svg'
  }
};

@Component({
  selector: 'check-box-pop-up',
  templateUrl: './check-box-pop-up.component.html',
  styleUrls: ['./check-box-pop-up.component.scss']
})
export class CheckBoxPopUpComponent implements OnInit, OnChanges, OnDestroy {
  @Input() modalId: string;
  @Input() mode: ECheckboxMode = ECheckboxMode.Multi;
  @Input() checkBoxImgType: ECheckBoxType = ECheckBoxType.Tick;
  @Input() optionType: EOptionType = EOptionType.File;
  @Input() additionalButton: EOptionalButton = EOptionalButton.UploadFile;
  @Input() hasBack: boolean = true;
  @Input() text = defaultText;
  @Input() checkBoxList = [];
  @Input() isMandatory = false;
  @Input() acceptTypeFile = ACCEPT_ONLY_SUPPORTED_FILE;
  @Input() isMultiple: boolean = true;
  @Input() isRequired: boolean = false;
  @Output() onBack = new EventEmitter();
  @Output() onClose = new EventEmitter();
  @Output() getCheckedList = new EventEmitter();
  clonedDefaultCheckBoxList = [];
  clonedFileArr = []; // cloned of local upload files but with custom properties
  isOverFileSize = false;
  isUnSupportFile = false;
  isDisabledNextBtn = false;
  fileTypes: IFileType[];
  popupState = {
    selectFiles: false
  };
  checkBoxImg = checkBoxImg;
  checkBoxForm: FormGroup;
  popupModalPosition = ModalPopupPosition;
  ECheckboxMode = ECheckboxMode;
  EOptionType = EOptionType;
  EOptionalButton = EOptionalButton;
  ECheckBoxType = ECheckBoxType;
  FILE_VALID_TYPE = FILE_VALID_TYPE;
  localFileInfo = {
    // display only
    pmName: '',
    currentDate: Date.now()
  };
  isShowSelectAtLeast = false;
  unSupportFile: boolean = false;
  overFileSize: boolean = false;
  private subscriber = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private fileService: FilesService,
    private apiService: ApiService,
    private userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']?.currentValue) {
      this.text = { ...defaultText, ...changes['text']?.currentValue };
    }
    this.isDisabledNextBtn = this.isMandatory;
    if (this.optionType === EOptionType.File) {
      this.getListFileType();
      this.getMapFiles();
      this.updateClonedFileArr();
    } else {
      this.checkBoxList = this.checkBoxList.map((it) => ({
        ...it,
        fullName: [it?.user?.firstName, it?.user?.lastName]
          .filter(Boolean)
          .join(' ')
      }));
    }
    this.initForm();
  }

  ngOnInit(): void {
    this.popupState.selectFiles = true;
    this.text = { ...defaultText, ...this.text };

    if (this.additionalButton === EOptionalButton.UploadFile) {
      // these info for display only
      const { firstName = '', lastName = '' } =
        this.userService.userInfo$.value || {};
      this.localFileInfo.pmName = [firstName, lastName]
        .filter(Boolean)
        .join(' ');
    }
  }

  initForm() {
    if (this.mode === ECheckboxMode.Multi) {
      const formControls = this.checkBoxList.reduce((controls, item, index) => {
        controls[index] = new FormControl(item?.checked || false);
        return controls;
      }, {});
      this.checkBoxForm = this.fb.group(formControls);
    } else {
      this.checkBoxForm = this.fb.group({
        singleValue: new FormControl('')
      });
    }
  }

  getMapFiles() {
    this.checkBoxList.forEach((file) => {
      (file.title = file?.name || file?.pdfName || file?.fileName),
        (file.created = file?.created || file?.createdAt),
        (file.fileName = file?.name || file?.pdfName || file?.fileName),
        (file.fileSize = file?.size || file?.fileSize),
        (file.icon = this.fileService.getFileIcon(
          file?.pdfName || file?.name || file?.fileName
        )),
        (file.mediaLink = file?.mediaLink || file?.pdfUrl);
      file.thumbMediaLink =
        file.icon === EAvailableFileIcon.PDF ? null : file.thumbMediaLink;
      file.thumbnail =
        file.icon === EAvailableFileIcon.PDF ? null : file.thumbnail;
    });
    this.clonedDefaultCheckBoxList = this.checkBoxList;
  }

  getListFileType() {
    if (!localStorage.getItem('listFileType')) {
      this.apiService
        .getAPI(properties, 'list-of-filetype')
        .pipe(takeUntil(this.subscriber))
        .subscribe((res: IFileType[]) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    } else {
      this.fileTypes = JSON.parse(localStorage.getItem('listFileType'));
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

  updateClonedFileArr() {
    this.fileService.originalLocalFiles
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (res) {
          this.clonedFileArr = this.fileService.getClonedFileArr();
          const checkedIds = this.checkBoxList
            .filter((e) => e.checked)
            .map((e) => e.id);
          const clonedDefaultCheckBoxListMapping =
            this.clonedDefaultCheckBoxList.map((e) => ({
              ...e,
              checked: checkedIds.includes(e.id)
            }));
          this.checkBoxList = [
            ...clonedDefaultCheckBoxListMapping,
            ...this.clonedFileArr
          ].map((it) => ({
            ...it,
            fullName: [it?.user?.firstName, it?.user?.lastName]
              .filter(Boolean)
              .join(' ')
          }));
          this.checkIsDisabledNextBtn();
        }
      });
  }

  async handleUploadFileLocal(event) {
    this.isShowSelectAtLeast = false;
    let fileUploaded = [];
    for (let i = 0; i < event.target.files.length; i++) {
      const files = event.target.files as LocalFile[];
      fileUploaded.push(files[i]);
      const fileExtension = this.fileService.getFileExtension(files[i]?.name);
      await processFile(files[i], fileExtension);

      const validFileType = validateFileExtension(
        files[i],
        this.FILE_VALID_TYPE
      );
      this.isOverFileSize = files[i].size / 1024 ** 2 > fileLimit;
      this.isUnSupportFile = !Boolean(
        this.fileTypes.find((el) => {
          return el.name === this.getFileType(files[i]).toLowerCase();
        })
      );
      files[i].id = uuid4();
      files[i].checked = true;
      if (!this.isOverFileSize && validFileType && !this.isUnSupportFile) {
        this.checkBoxForm.addControl(
          String(this.checkBoxList.length),
          new FormControl(true)
        );
        const originalLocalFiles = this.fileService.originalLocalFiles.value;
        this.fileService.originalLocalFiles.next([
          ...originalLocalFiles,
          files[i]
        ]);
      }
    }
    this.validateFile(fileUploaded);
  }

  validateFile(files) {
    this.unSupportFile = files?.some(
      (item) => !validateFileExtension(item, FILE_VALID_TYPE)
    );
    this.overFileSize = files?.some(
      (item) => item.size / 1024 ** 2 > fileLimit
    );
  }

  // use checked property to filter checked list
  onChangeCheckBox(event, checkBoxItem) {
    checkBoxItem.checked = !checkBoxItem.checked;
    if (checkBoxItem.lastModified) {
      // addition handle file item upload from local
      const originalLocalFile = this.fileService.originalLocalFiles.value?.find(
        (localFile) => localFile?.id === checkBoxItem?.id
      );
      originalLocalFile.checked = checkBoxItem.checked;
    }
    this.checkIsDisabledNextBtn();
    this.isShowSelectAtLeast = false;
  }

  onChangeSingleCheckBox(event, checkBoxItem) {
    this.checkBoxList = this.checkBoxList.map((it) => {
      if (it.id === checkBoxItem.id) {
        return {
          ...it,
          checked: true
        };
      }
      return {
        ...it,
        checked: false
      };
    });
    if (checkBoxItem.lastModified) {
      const originalLocalFiles =
        this.fileService.originalLocalFiles?.value ?? [];
      for (const file of originalLocalFiles) {
        file.checked = file.id === checkBoxItem.id ? true : false;
      }
    }
    this.checkIsDisabledNextBtn();
  }

  handleOnCLose() {
    this.onClose.emit();
    this.fileService.originalLocalFiles.next([]);
    this.handlePopupState({ selectFiles: false });
  }

  handleOnBack() {
    this.onBack.emit();
    this.fileService.originalLocalFiles.next([]);
    this.handlePopupState({ selectFiles: false });
  }

  handleOnNext() {
    if (this.fileService.originalLocalFiles.value?.length) {
      // only when upload file local
      const checkedLocalFiles = [...this.checkBoxList].reduce(
        (originalFiles, file) => {
          if (!file?.mediaLink) {
            const originalLocalFile =
              this.fileService.originalLocalFiles.value?.find(
                (localFile) => localFile.id === file.id
              );
            originalLocalFile.checked = file.checked;
            originalFiles?.push(originalLocalFile);
          }
          return originalFiles;
        },
        []
      );
      this.fileService.originalLocalFiles.next(checkedLocalFiles);
    }
    const checkedList = cloneDeep(this.checkBoxList)
      ?.filter((item) => item.checked)
      .map((item) => {
        delete item.checked;
        return item;
      });

    if (checkedList.length === 0 && this.isRequired) {
      this.isShowSelectAtLeast = true;
    } else {
      this.getCheckedList.emit(checkedList);
    }
  }

  handlePopupState(state) {
    this.popupState = { ...this.popupState, ...state };
  }

  checkIsDisabledNextBtn() {
    if (this.isMandatory && this.checkBoxList?.length) {
      this.isDisabledNextBtn = !this.checkBoxList.some((it) => it?.checked);
    }
  }

  ngOnDestroy() {
    this.subscriber.next();
    this.subscriber.complete();
  }
}

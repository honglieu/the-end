import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { differenceInCalendarDays } from 'date-fns';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  take,
  takeUntil,
  Subscription,
  timer,
  combineLatest
} from 'rxjs';
import dayjs from 'dayjs';
import { UserService } from '@services/user.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { FilesService, LocalFile } from '@services/files.service';
import { FileUploadService } from '@services/fileUpload.service';
import { OutOfOfficeFormService } from '@/app/mailbox-setting/services/out-of-office-form.service';
import { OutOfOfficeService } from '@/app/mailbox-setting/services/out-of-office-state.service';
import {
  MappingFiles,
  OutOfOffice
} from '@shared/types/profile-setting.interface';
import {
  processFile,
  validateFileExtension
} from '@shared/feature/function.feature';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FILE_VALID_TYPE, SHORT_ISO_DATE } from '@services/constants';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import {
  OUT_OF_OFFICE_RESPONSE_OFF,
  OUT_OF_OFFICE_RESPONSE_ON
} from '@services/messages.constants';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { PhotoType } from '@shared/types/task.interface';
import { fileLimit } from 'src/environments/environment';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { EToastType } from '@/app/toast/toastType';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';
import { ActivatedRoute } from '@angular/router';
import { IMailBox } from '@shared/types/user.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

enum ERROR_MESSAGE {
  OVER_SIZE = 'Your file is larger than 25MB. Please upload a smaller file.',
  UNSUPPORTED = 'Unsupported file type.',
  REQUIRED = 'Required field.',
  LAST_DATE = 'Last date must be equal or greater than first date.'
}
@Component({
  selector: 'out-of-office',
  templateUrl: './out-of-office.component.html',
  styleUrls: ['./out-of-office.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OutOfOfficeComponent implements OnInit, OnDestroy {
  @Input() file: boolean = true;
  @Input() acceptType: string = ACCEPT_ONLY_SUPPORTED_FILE;
  @Input() noAddFile: boolean = false;

  private subscribers = new Subject<void>();
  private subscription: Subscription;
  public isOverFileSize: boolean = false;
  public isUnSupportFile: boolean = false;
  public timeUpload: number;
  public date: Date;
  public datePickerStatus: string;
  public formSubmitAttempt: boolean;
  public isResponder: boolean = false;
  public textEditor: string = '';
  public defaultSetting: OutOfOffice;
  public isLoading: boolean = false;
  public isEdit: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public showAddFile: boolean;
  public errorMessage = ERROR_MESSAGE;
  public configs: IConfigs = defaultConfigs;
  public nzParagraph = {
    rows: 0
  };
  public isCancel = false;
  public isLoadingSkeleton: boolean = false;
  public isFocus: boolean = false;
  private currentCompany: ICompany;
  private dateFormatDayJS = null;
  showPopupInvalidFile = false;
  attachmentTextEditorConfigs = {
    'footer.buttons.showBackBtn': false
  };
  addContactCardTextEditorConfigs = {
    'header.title': 'Add contact card'
  };
  public hasSignature: boolean = true;
  public isConsole = false;
  public currentMailboxId: string;
  public pmOutOfOfficeDocuments: LocalFile[] = [];
  public currentMailbox: IMailBox;
  public allowInsertContactCardToContent: boolean = true;
  public prefillContactCard: ISelectedReceivers[] = [];

  constructor(
    private toastService: ToastrService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private userService: UserService,
    private emailSignatureService: CompanyEmailSignatureService,
    private fileService: FilesService,
    private fileUploadService: FileUploadService,
    private outOfOfficeFormService: OutOfOfficeFormService,
    private outOfOfficeService: OutOfOfficeService,
    private agencyDashboardService: AgencyDashboardService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private uploadFromCRMService: UploadFromCRMService,
    private cdr: ChangeDetectorRef,
    public inboxService: InboxService,
    private sharedService: SharedService,
    public mailboxSettingService: MailboxSettingService,
    private companyService: CompanyService,
    private activeRoute: ActivatedRoute
  ) {}

  get outOfOfficeForm(): FormGroup {
    return this.outOfOfficeFormService.outOfOfficeGroup;
  }

  get firstDate(): AbstractControl {
    return this.outOfOfficeForm.get('firstDate');
  }

  get lastDate(): AbstractControl {
    return this.outOfOfficeForm.get('lastDate');
  }

  get message(): AbstractControl {
    return this.outOfOfficeForm.get('message');
  }

  get includeSignature(): AbstractControl {
    return this.outOfOfficeForm.get('includeSignature');
  }

  get id(): AbstractControl {
    return this.outOfOfficeForm.get('id');
  }

  get listOfFiles(): AbstractControl {
    return this.outOfOfficeForm.get('listOfFiles');
  }

  get selectedContactCard(): AbstractControl {
    return this.outOfOfficeForm.get('selectedContactCard');
  }

  get listSelectedContact() {
    return this.trudiAddContactCardService.getSelectedContactCard();
  }

  get popupState() {
    return this.trudiAddContactCardService.getPopupState();
  }

  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  ngOnInit() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.outOfOfficeFormService.buildForm();
    combineLatest([
      this.activeRoute.queryParams,
      this.inboxService.listMailBoxs$
    ])
      .pipe(takeUntil(this.subscribers))
      .subscribe(([queryParams, listMailBoxs]) => {
        this.currentMailboxId = queryParams['mailBoxId'];
        this.currentMailbox = listMailBoxs?.find(
          (mailbox) => mailbox?.id === queryParams['mailBoxId']
        );
      });
    this.agencyDateFormatService.dateFormatDayJS$.subscribe(
      (dateFormat) => (this.dateFormatDayJS = dateFormat)
    );

    this.listOfFiles.valueChanges.subscribe((data) => {
      if (data?.length > 0) {
        this.isEdit = true;
        this.handleUploadFile(data);
      } else {
        this.pmOutOfOfficeDocuments = [];
      }
    });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscribers))
      .subscribe((data) => {
        this.isLoadingSkeleton = true;
        if (!data) return;
        this.getSetting();
        this.currentCompany = data;
      });

    this.lastDate.valueChanges
      .pipe(takeUntil(this.subscribers))
      .subscribe((data) => {
        this.handleFocus(false);
        this.message.setValue(this.handleReplaceContentText(this.textEditor));
        if (!!data) {
          this.isEdit = true;
        }
      });

    this.firstDate.valueChanges
      .pipe(takeUntil(this.subscribers))
      .subscribe((data) => {
        this.message.setValue(this.handleReplaceContentText(this.textEditor));
        if (!!data || !this.firstDate?.invalid) {
          this.lastDate.updateValueAndValidity();
          this.isEdit = true;
        }
      });

    this.userService.getUserInfo();
  }

  editorAddFileFromCrm() {
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRMOutside: true
    });
  }

  handleCheckEmailSignature(e) {
    this.hasSignature = e;
    if (!this.isEdit) {
      this.isEdit = true;
    }
  }

  private getSetting() {
    this.isLoadingSkeleton = true;
    this.mailboxSettingApiService
      .getOutOfOffice(this.currentMailboxId)
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (data) => {
          if (!data) return;
          this.defaultSetting = {
            ...data,
            message: this.handleReplaceContentText(
              this.formatTextToHTML(data?.message)
            )
          };

          const {
            includeSignature,
            id,
            firstDate,
            lastDate,
            pmOutOfOfficeDocuments,
            options,
            message
          } = this.defaultSetting;

          this.hasSignature = includeSignature ?? true;
          const contactCards = options ? JSON.parse(options).contacts : [];
          this.prefillContactCard = this.allowInsertContactCardToContent
            ? contactCards
            : [];
          this.outOfOfficeForm.setValue({
            id: id || 0,
            firstDate: firstDate ? new Date(firstDate) : '',
            lastDate: lastDate ? new Date(lastDate) : '',
            message: message || '',
            includeSignature: this.hasSignature,
            listOfFiles: this.getMapFilesUpload(pmOutOfOfficeDocuments) ?? [],
            selectedContactCard: contactCards
          });
          this.isResponder = !!id || this.isResponder;
          this.message.setValue(message);
          this.textEditor = message;
          this.trudiAddContactCardService.setSelectedContactCard(contactCards);
          this.emailSignatureService.selectedButtonInline.next(
            this.hasSignature
          );
          if (includeSignature === true) {
            this.emailSignatureService.existingSignature.next(false);
          }
          if (includeSignature === false) {
            this.emailSignatureService.existingSignature.next(
              includeSignature || false
            );
          }
          this.isEdit = false;
          this.isLoadingSkeleton = false;
        },
        error: () => {
          this.isLoadingSkeleton = false;
        }
      });
  }

  onCloseAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCardOutside) {
      this.trudiAddContactCardService.setPopupState({
        addContactCardOutside: false
      });
    }
  }

  private async getUploadBucketS3(listOfFilesUpload) {
    const pmOutOfOfficeDocuments = [];
    this.isLoading = true;
    await Promise.all(
      listOfFilesUpload?.map(async (el) => {
        const fileToSend = el[0];
        let filesUploadBucketS3 = null;

        if (
          !fileToSend.mediaLink &&
          fileToSend.canUpload &&
          !fileToSend.uploaded
        ) {
          filesUploadBucketS3 = await this.fileUploadService.uploadFileProfile(
            fileToSend,
            this.defaultSetting.id
          );
        }
        pmOutOfOfficeDocuments.push({
          title: el.title || fileToSend.title || fileToSend.name,
          name: fileToSend.name,
          url: fileToSend.name,
          size: fileToSend.size,
          fileType: fileToSend?.type || fileToSend.fileType?.name,
          mediaLink: filesUploadBucketS3
            ? filesUploadBucketS3.Location
            : fileToSend.mediaLink,
          pmOutOfOfficeId: this.defaultSetting.id,
          parentId: fileToSend.parentId
        });
        if (filesUploadBucketS3) {
          fileToSend.mediaLink = filesUploadBucketS3.Location;
          fileToSend.uploaded = true;
        }
      })
    );
    this.isLoading = false;
    return pmOutOfOfficeDocuments;
  }

  private async handleUploadFile(listOfFilesUpload) {
    const filesUpload = listOfFilesUpload.filter((el) => !el[0].mediaLink);
    this.isOverFileSize = false;
    this.isUnSupportFile = false;
    filesUpload.forEach((file) => {
      const fileCheck = file[0] || file;
      const validFileType = validateFileExtension(fileCheck, FILE_VALID_TYPE);
      const isOverFileSize = fileCheck?.size / 1024 ** 2 > fileLimit;
      if (!validFileType) {
        this.isUnSupportFile = true;
      } else if (isOverFileSize) {
        this.isOverFileSize = true;
      } else {
        file[0].canUpload = true;
        file[0].uploaded = false;
      }
    });

    this.pmOutOfOfficeDocuments = await this.getUploadBucketS3(
      listOfFilesUpload
    );
  }

  private handleReplaceContentText(mess: string) {
    const phoneNumber = this.currentCompany?.phoneNumber;
    let message = mess;
    !!phoneNumber &&
      (message = message.replace(/{agency phone number}/g, phoneNumber));

    message = message.replace(/{the office}/g, '{agency phone number}');
    return message;
  }

  private getMapFilesUpload(filesUpload: LocalFile[]): MappingFiles[] {
    if (!filesUpload) return null;
    return filesUpload.map((fileUpload) => {
      if (fileUpload?.fileType?.name?.indexOf('video') > -1) {
        fileUpload.isSupportedVideo = true;
        fileUpload.localThumb = fileUpload.thumbMediaLink;
      } else if (fileUpload?.fileType?.name?.indexOf('image') > -1) {
        fileUpload.localThumb = fileUpload.mediaLink;
      }
      return {
        '0': fileUpload,
        icon: this.fileService.getFileIcon(fileUpload?.name),
        id: uuid4()
      };
    });
  }

  validateFile(files: LocalFile[] | PhotoType[] | MappingFiles[]) {
    this.isUnSupportFile = false;
    this.isOverFileSize = false;
    files.forEach((file: LocalFile | PhotoType | MappingFiles) => {
      const fileToCheck = file[0] || file;
      const validFileType = validateFileExtension(fileToCheck, FILE_VALID_TYPE);
      const isOverFileSize = fileToCheck?.size / 1024 ** 2 > fileLimit;

      if (!validFileType) {
        this.isUnSupportFile = true;
      }
      if (isOverFileSize) {
        this.isOverFileSize = true;
      }
    });
  }

  /*
    event listener
  */
  disabledDate = (current: Date): boolean => {
    return differenceInCalendarDays(current, this.getToday()) < 0;
  };

  disableLastDate = (current: Date): boolean => {
    const date = !!this.firstDate.value
      ? new Date(this.firstDate.value)
      : this.getToday();
    return differenceInCalendarDays(current, date) < 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  openDatePicker(status: boolean) {
    if (status) this.datePickerStatus = null;
  }

  handleChangeCheckbox(value: boolean) {
    this.isEdit = value;
    this.isResponder = value;
    this.emailSignatureService.existingSignature.next(value);
    if (!value && !!this.defaultSetting.id) {
      this.mailboxSettingApiService
        .turnOffOutOfOffice(this.defaultSetting.id)
        .pipe(takeUntil(this.subscribers))
        .subscribe({
          next: () => {
            this.toastService.show(
              OUT_OF_OFFICE_RESPONSE_OFF,
              null,
              {},
              EToastType.CHECK_WHITE
            );
            this.trudiAddContactCardService.setSelectedContactCard([]);
          }
        });
    } else this.getSetting();
    this.formSubmitAttempt = false;
  }

  handleValueChange(value: string) {
    this.textEditor = value;
  }

  handleChangeOriginContent(value: string) {
    this.outOfOfficeFormService.setOriginMsgContent(value);
    this.message.updateValueAndValidity();
  }

  handleFocus(value: boolean) {
    if (this.isFocus === value) {
      return;
    }
    this.isFocus = value;
    const content = this.handleReplaceContentText(this.textEditor);
    //Fix bug cursor position change to head after update content style
    if (content !== this.textEditor) {
      this.message.setValue(content);
    }
    this.cdr.markForCheck();
    this.isEdit = true;
  }

  /* Handle upload attachment file */
  addFileComputer() {
    const button = document.querySelector(
      '#out-of-office-upload-btn'
    ) as HTMLDivElement;
    button?.click();
  }

  dropFileComputer(event) {
    const file = [event]?.flatMap((item) => item);
    this.listOfFiles.setValue([...this.listOfFiles.value, ...file]);
  }

  async uploadFileLocal(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (!files) return;
    const filesArr = Object.values(files) as LocalFile[];
    for (let index = 0; index < filesArr.length; index++) {
      const file = filesArr[index];
      const fileExtension = this.fileService.getFileExtension(file?.name);
      await processFile(file, fileExtension);
    }
    const additionalFiles = this.getMapFilesUpload(filesArr);

    this.listOfFiles.setValue([...this.listOfFiles.value, ...additionalFiles]);
  }

  removeFileLocal(index: number) {
    const filesUpload = this.listOfFiles.value;
    filesUpload.splice(index, 1);
    this.listOfFiles.setValue(filesUpload);
    this.isEdit = true;
  }

  /* Handle upload attachment contact */
  openModalContact() {
    this.trudiAddContactCardService.setPopupState({
      addContactCardOutside: true
    });
  }

  removeContact(currContact) {
    const list = this.trudiAddContactCardService.getSelectedContactCard();
    const findIndex = list.findIndex(
      (contact) => contact.id === currContact.id
    );

    list.splice(findIndex, 1);

    this.selectedContactCard.setValue(list);
    this.trudiAddContactCardService.setSelectedContactCard(list);
    this.isEdit = true;
  }

  onTrigger() {
    this.isEdit = true;
    this.trudiAddContactCardService.setPopupState({
      addContactCardOutside: false,
      isClickedAddButton: false
    });
  }

  onTriggerAddFilesFromCrm() {
    this.isEdit = true;
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRMOutside: false
    });
    this.listOfFiles.setValue([
      ...this.listOfFiles.value,
      ...this.selectedFilesFromCMS
    ]);
  }

  onCloseUploadFromCRM() {
    if (this.uploadFileFromCRMPopupState.uploadFileFromCRMOutside) {
      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRMOutside: false
      });
    }
  }

  /* Handle action form */
  async handleSave() {
    this.message.setValue(this.textEditor);
    this.outOfOfficeForm.markAllAsTouched();
    this.formSubmitAttempt = true;
    if (!this.outOfOfficeForm.invalid) {
      this.isLoading = true;
      const contactCards = this.allowInsertContactCardToContent
        ? []
        : this.selectedContactCard.value;
      const body = {
        firstDate: dayjs(this.firstDate.value).format(SHORT_ISO_DATE),
        lastDate: dayjs(this.lastDate.value).format(SHORT_ISO_DATE),
        message: this.textEditor,
        includeSignature: this.hasSignature,
        pmOutOfOfficeDocuments: this.pmOutOfOfficeDocuments,
        options: { contacts: contactCards },
        id: !!this.id.value ? this.id.value : '',
        mailBoxId: this.currentMailboxId
      };

      this.mailboxSettingApiService
        .updateOutOfOffice(body)
        .pipe(takeUntil(this.subscribers))
        .subscribe({
          next: () => {
            this.toastService.show(
              OUT_OF_OFFICE_RESPONSE_ON,
              null,
              {},
              EToastType.CHECK_WHITE
            );
            this.getSetting();
            this.isEdit = false;
            this.isLoading = false;
            this.formSubmitAttempt = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.isEdit = false;
            this.formSubmitAttempt = false;
          }
        });
    }
  }

  setEmptyContentMessage() {
    this.message.setValue(null);
  }

  setEmptyContent() {
    const {
      options,
      id,
      firstDate,
      lastDate,
      pmOutOfOfficeDocuments,
      includeSignature
    } = this.defaultSetting ?? {};
    const selectedContactCard = options ? JSON.parse(options)?.contacts : [];
    this.outOfOfficeForm.reset({
      id,
      firstDate,
      lastDate,
      listOfFiles: this.getMapFilesUpload(pmOutOfOfficeDocuments) ?? [],
      includeSignature: includeSignature ?? true,
      selectedContactCard
    });
    this.outOfOfficeService.triggerResetOutOfOfficeContent();
    this.selectedContactCard.setValue(selectedContactCard);
    this.trudiAddContactCardService.setSelectedContactCard(selectedContactCard);
    this.isEdit = false;
    this.formSubmitAttempt = false;
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  handleCancel() {
    timer(200)
      .pipe(take(1))
      .subscribe(() => this.setEmptyContent());
  }

  formatTextToHTML(text: string) {
    if (!text) return text;
    const newLine = /(\r\n|\n|\r)/gm;
    //NOTE: Editor cannot set style for the <br> element, so we must use the paragraph instead of <br>
    if (text.indexOf('<p>') === -1) {
      return `<p>${text
        .replace(newLine, '</p><p>')
        .replace(/\n/gm, '</p><p>')}</p>`;
    } else {
      return text.replace(newLine, '</p><p>').replace(/\n/gm, '</p><p>');
    }
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
    this.subscription?.unsubscribe();
  }
}

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { fileLimit } from 'src/environments/environment';
import { validateFileExtension } from '@shared/feature/function.feature';
import { MAILBOX_VALID_FILE_TYPE } from '@services/constants';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, filter, of, switchMap, takeUntil } from 'rxjs';
import { UserService } from '@/app/dashboard/services/user.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastrService } from 'ngx-toastr';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { IEmailImport } from './interfaces/import-email.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { IMailBox } from '@shared/types/user.interface';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { SharedService } from '@services/shared.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { CompanyService } from '@services/company.service';

interface IPopupState {
  emailImport: boolean;
  emailPreview: boolean;
}
@Component({
  selector: 'email-import-pop-up',
  templateUrl: './email-import-pop-up.component.html',
  styleUrls: ['./email-import-pop-up.component.scss']
})
export class EmailImportPopUpComponent implements OnInit, OnDestroy {
  @Output() onQuit = new EventEmitter();
  @ViewChild('dropdown') dropdown: ElementRef;

  public showPopover: boolean = false;
  public isImporting = false;
  public previewData: IEmailImport = null;
  public currentMailbox: IMailBox = null;
  public currentMailboxId = '';
  public currentMailboxDefault: IMailBox = null;
  public listMailBoxs = [];
  public crmStatus = '';
  public destroy$ = new Subject<void>();
  public popupState: IPopupState = {
    emailImport: false,
    emailPreview: false
  };
  public isScanning = false;
  public isConsole: boolean;
  public isDisconnectedMailbox: boolean;

  public overFileSize = false;
  public isValidFileUploadType = true;
  public selectedFile = null;
  public fileError = null;
  public isDisconnectAllMail: boolean;
  readonly mailBoxType = EMailBoxType;

  constructor(
    private cdr: ChangeDetectorRef,
    private agencyService: AgencyService,
    private userService: UserService,
    private inboxService: InboxService,
    private toastService: ToastrService,
    private dashboardApiService: DashboardApiService,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private sharedService: SharedService,
    private mailboxSettingService: MailboxSettingService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDisconnectedMailbox) => {
        this.isDisconnectedMailbox = isDisconnectedMailbox;
      });
    this.inboxService.listMailBoxs$.subscribe((mailbox) => {
      if (!mailbox) return;
      this.isDisconnectAllMail = mailbox.every(
        (rs) => rs.status === EMailBoxStatus.DISCONNECT
      );
    });
    this.setPopUpState({ emailImport: true });
    this.subcribeMailbox();
  }

  getEmailScanning(file) {
    if (!file) return;
    this.isScanning = true;
    const formData = new FormData();
    formData.append('file', file);
    this.dashboardApiService.getEmailImportScanning(formData).subscribe({
      next: (res) => {
        this.previewData = res;
        this.isScanning = false;
        this.cdr.markForCheck();
        this.setPopUpState({ emailImport: false, emailPreview: true });
      },
      error: (error) => {
        this.fileError = 'Message import failed. Please try again';
        this.isScanning = false;
        this.cdr.markForCheck();
      }
    });
  }

  subcribeMailbox() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((mailBoxId) => {
          if (!mailBoxId) return of(null);
          this.currentMailboxId = mailBoxId;
          return this.inboxService.listMailBoxs$;
        })
      )
      .subscribe((mailBoxs) => {
        this.listMailBoxs =
          mailBoxs
            .filter(
              (item) =>
                item.status !== EMailBoxStatus.ARCHIVE &&
                item.status !== EMailBoxStatus.DISCONNECT
            )
            .sort((mailboxA, mailboxB) =>
              mailboxA.name.localeCompare(mailboxB.name, 'en', {
                numeric: true
              })
            ) || [];
        this.currentMailbox =
          this.listMailBoxs.find((mail) => mail.id === this.currentMailboxId) ||
          this.listMailBoxs[0];
        this.currentMailboxDefault = this.currentMailbox;
      });
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        filter((company) => !!company)
      )
      .subscribe((company) => {
        this.crmStatus = company.crmSystem;
      });
  }

  handleChangeMailbox(item) {
    this.currentMailbox = item;
  }

  fileBrowseHandler(event) {
    const file = event.target.files[0];
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    this.selectedFile = null;
    this.showPopover = false;
    if (file) {
      const fileSizeMb = file.size / 1024 ** 2;
      this.isValidFileUploadType = validateFileExtension(
        file,
        MAILBOX_VALID_FILE_TYPE
      );
      this.overFileSize = fileSizeMb > fileLimit;

      if (!this.validateFile()) return;
      this.getEmailScanning(file);
    }
  }

  validateFile() {
    if (this.overFileSize) {
      this.fileError =
        'Your file is larger than 25MB. Please upload a smaller file.';
      return false;
    }
    if (!this.isValidFileUploadType) {
      this.fileError = 'Unsupported file type.';
      return false;
    }
    this.fileError = '';
    return true;
  }

  setPopUpState(state: Partial<IPopupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  resetPopUpState() {
    this.setPopUpState({ emailPreview: false, emailImport: false });
  }

  handleClose() {
    this.selectedFile = null;
    this.destroy$.next();
    this.destroy$.complete();
    this.resetPopUpState();
    this.onQuit.emit();
  }

  handlePreviewBack() {
    this.selectedFile = null;
    this.setPopUpState({ emailImport: true, emailPreview: false });
  }

  next() {
    if (!this.selectedFile?.length) {
      this.fileError = 'Required field';
      return;
    }
    this.setPopUpState({ emailImport: false, emailPreview: true });
  }

  handleImport() {
    this.isImporting = true;
    this.dashboardApiService
      .importMailBox({
        ...this.previewData,
        mailBoxId: this.currentMailbox.id
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.inboxService.setCurrentMailBoxId(this.currentMailbox?.id);
          this.isImporting = false;
          this.onQuit.emit();
          this.router.navigate(['dashboard', 'inbox', 'messages'], {
            queryParams: {
              ...this.activeRouter.snapshot.queryParams,
              type: TaskType.MESSAGE,
              status: TaskStatusType.inprogress,
              taskId: res.taskId,
              mailBoxId: this.currentMailbox.id
            },
            queryParamsHandling: 'merge'
          });
          this.inboxService.setImportEmailId(res.taskId);
        },
        error: (err) => {
          this.isImporting = false;
          this.toastService.error('Message import failed. Please try again');
          this.cdr.markForCheck();
        }
      });
  }

  togglePopover(): void {
    this.showPopover = !this.showPopover;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdown?.nativeElement?.contains(event.target)) {
      this.showPopover = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

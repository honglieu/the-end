import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { Subject } from 'rxjs/internal/Subject';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  filter,
  first
} from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import {
  Component,
  OnInit,
  Input,
  Output,
  OnDestroy,
  EventEmitter
} from '@angular/core';
import { TaskFolderService } from '@/app/dashboard/services/task-folder.service';
import { ETrudiIconType } from '@trudi-ui';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  EEmailFolderPopup,
  EInboxAction
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EmailFolderService } from '@/app/dashboard/modules/inbox/components/gmail-folder-sidebar/services/email-folder.service';
import { SharedService } from '@services/shared.service';
import {
  LABEL_EXTERNAL_ID_MAIL_BOX,
  LABEL_NAME_OUTLOOK
} from '@services/constants';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'create-edit-task-folder-pop-up',
  templateUrl: './create-edit-task-folder-pop-up.component.html',
  styleUrls: ['./create-edit-task-folder-pop-up.component.scss']
})
export class CreateEditTaskFolderPopUpComponent implements OnInit, OnDestroy {
  @Input() showPopup = false;
  @Input() inCreateTask = false;
  @Input() hasBackButton = false;
  @Input() mailBoxId: string;
  @Output() closePopup = new EventEmitter();
  @Output() nextPopup = new EventEmitter();
  @Output() backPopup = new EventEmitter();
  @Output() createFolderConfirm = new EventEmitter();
  private destroy$ = new Subject<void>();
  public checkSubmitted = true;
  public listIcon = Object.keys(ETrudiIconType).map((it) => ({
    icon: it,
    src: 'assets/images/folder-images/' + ETrudiIconType[it] + '.png',
    name: ETrudiIconType[it]?.replace(/^trudi-fi-sr-|^trudi-/, '') as string
  }));
  public listSearchIcon = this.listIcon;
  public selectedIcon = this.listIcon.find(
    (it) => it.icon === 'TrudiFiSrFolder'
  );
  private currentMailBoxId: string;
  private agencyId: string;
  private taskFolders: ITaskFolder[] = [];
  public selectedTaskFolder: ITaskFolder;
  public isEditFolder = false;
  public isLoading = false;
  public mailBehavior: { deleted: string | null; resolved: string | null };
  public folderEmails: any;
  public mailBoxActive: boolean;
  public isConsole: boolean = false;
  public companyId: string;

  constructor(
    private taskFolderService: TaskFolderService,
    private dashboardApiService: DashboardApiService,
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private mailboxSettingService: MailboxSettingService,
    public folderService: FolderService,
    private emailFolderService: EmailFolderService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {
    this.taskFolderService.initFolderForm();
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.mailboxSettingService.mailboxSetting$
      .pipe(
        filter((res) => !!res?.mailBehavior),
        first()
      )
      .subscribe((res) => {
        if (res.mailBehavior.resolved) {
          this.mailBehavior = res?.mailBehavior;
          if (this.isEditFolder) return;
          this.labelId.setValue(res?.mailBehavior?.resolved, {
            emitEvent: false
          });
        }
      });

    this.taskFolderService.selectedTaskFolderBS
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.isEditFolder = res.actionEditFolder ? true : false;
          this.selectedTaskFolder = res;
          this.selectedIcon = this.listIcon.find((it) => it.icon === res.icon);
          this.nameControl.setValue(res.name?.trim(), { emitEvent: false });
          this.labelId.setValue(res?.labelId, {
            emitEvent: false
          });
        }
      });

    combineLatest([
      this.inboxService.getCurrentMailBoxId(),
      this.inboxSidebarService.taskFolders$
    ])
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(([currentMailBoxId, taskFolders]) => {
        this.currentMailBoxId = currentMailBoxId;
        this.taskFolders = taskFolders || [];
      });

    this.iconControl?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe((value) => {
        if (!value) {
          this.listSearchIcon = this.listIcon;
        } else {
          this.listSearchIcon = this.listIcon.filter((it) =>
            it?.name?.toLowerCase()?.includes(value.toLowerCase())
          );
        }
      });

    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailBox) => {
        this.folderEmails = this.folderService
          .flattenTreeEmailFolder(
            this.folderService.getEmailFolderByMailBoxId(mailBox.id).tree,
            '',
            mailBox.id
          )
          .filter(
            (item) =>
              item.internalId !== mailBox?.spamFolder?.id &&
              item?.wellKnownName !== EInboxAction.INBOX &&
              item?.wellKnownName !== LABEL_NAME_OUTLOOK.SENT_ITEMS &&
              item?.externalId !== LABEL_EXTERNAL_ID_MAIL_BOX.SENT
          );
        this.mailBoxActive = mailBox.status === EMailBoxStatus.ACTIVE;
        if (!this.mailBoxActive) {
          this.folderEmails = [];
          return;
        }
      });
    this.emailFolderService.emailFolderId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((emailFolderId) => {
        if (emailFolderId) {
          const emailFolderAction = this.emailFolderService.emailFolderAction;
          if (
            !emailFolderAction ||
            emailFolderAction === EEmailFolderPopup.RESOLVED_MESSAGE
          ) {
            this.labelId.setValue(emailFolderId);
            this.labelId.setValue(emailFolderId, {
              emitEvent: false
            });
          }
        }
      });

    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((companyId) => {
        this.companyId = companyId;
      });
  }

  chooseIcon(item) {
    this.selectedIcon = item;
  }

  handleClose() {
    this.closePopup.emit();
    this.taskFolderForm.reset();
    this.listSearchIcon = this.listIcon;
  }

  handleConfirm() {
    this.taskFolderForm.markAllAsTouched();
    if (this.taskFolderForm.invalid) {
      this.nameControl.setValue(this.nameControl.value?.trim(), {
        emitEvent: false
      });
      return;
    }
    this.taskFolderForm.disable();
    this.isLoading = true;
    if (this.isEditFolder) {
      const folders = this.taskFolders.find(
        (it) => it.id === this.selectedTaskFolder.id
      );

      const updatedTaskFolder = {
        ...folders,
        icon: this.selectedIcon.icon,
        name: this.nameControl.value?.trim(),
        labelId: this.labelId.value
      };

      this.dashboardApiService
        .updateTaskFolder([updatedTaskFolder])
        .subscribe((res) => {
          this.taskFolderForm.enable();
          const updateTaskFolders = [...this.taskFolders].map((it) => {
            if (it.id === this.selectedTaskFolder.id) {
              return {
                ...it,
                icon: this.selectedIcon?.icon,
                name: this.nameControl.value?.trim(),
                labelId: this.labelId.value
              };
            }
            return it;
          });
          this.inboxSidebarService.setInboxTaskFolder(updateTaskFolders);
          this.isLoading = false;
          this.handleClose();
        });
    } else {
      const maxOrder = this.taskFolders.reduce(
        (maxOrder, item) => (item.order > maxOrder ? item.order : maxOrder),
        0
      );
      this.dashboardApiService
        .createTaskFolder({
          companyId: this.companyId,
          icon: this.selectedIcon.icon,
          name: this.nameControl.value,
          order: maxOrder + 1,
          labelId: this.labelId.value
        })
        .subscribe({
          next: (res) => {
            this.taskFolderForm.enable();
            this.isLoading = false;
            if (!this.mailBoxId || this.mailBoxId === this.currentMailBoxId) {
              this.inboxSidebarService.setInboxTaskFolder([
                ...this.taskFolders,
                {
                  ...res,
                  taskCount: 0
                }
              ]);
            }
            this.createFolderConfirm.emit({
              id: res.id,
              mailBoxId: res.mailBoxId,
              icon: res.icon,
              name: res.name,
              order: res.order
            });
            this.inCreateTask ? this.handleBack() : this.handleClose();
          }
        });
    }
  }

  handleBack() {
    this.backPopup.emit();
  }

  handleAddEmailFolder() {
    this.emailFolderService.setIsVisibleCreateEmailFolder(true);
    this.emailFolderService.setEmailFolderAction(
      EEmailFolderPopup.EMAIL_FOLDER_STEP
    );
    this.taskFolderService.setSelectedTaskFolder({
      icon: this.selectedIcon.icon,
      name: this.nameControl.value,
      ...this.selectedTaskFolder
    });
    this.closePopup.emit();
  }

  get taskFolderForm() {
    return this.taskFolderService?.form;
  }

  get iconControl() {
    return this.taskFolderForm?.get('icon');
  }

  get nameControl() {
    return this.taskFolderForm?.get('name');
  }

  get labelId() {
    return this.taskFolderForm?.get('labelId');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (
      !(
        this.emailFolderService.emailFolderAction ===
        EEmailFolderPopup.EMAIL_FOLDER_STEP
      )
    ) {
      this.taskFolderService.setSelectedTaskFolder(null);
    }
    this.emailFolderService.setEmailFolderId(null);
  }
}

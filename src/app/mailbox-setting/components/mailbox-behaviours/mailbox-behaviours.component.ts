import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { EmailFolderService } from '@/app/dashboard/modules/inbox/components/gmail-folder-sidebar/services/email-folder.service';
import {
  EEmailFolderPopup,
  EInboxAction
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { LoadingService } from '@services/loading.service';
import { SharedService } from '@services/shared.service';
import { EmailProvider } from '@shared/enum/inbox.enum';
import {
  IBehaviourFolder,
  ICategoryTaskActivity,
  IMailboxSetting,
  ISaveMailboxBehavioursResponse
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  EMailboxSettingTab,
  EUserMailboxRole
} from '@/app/mailbox-setting/utils/enum';
import { CompanyService } from '@services/company.service';
import {
  LABEL_EXTERNAL_ID_MAIL_BOX,
  LABEL_NAME_OUTLOOK
} from '@services/constants';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { IMailBox } from '@shared/types/user.interface';
@Component({
  selector: 'mailbox-behaviours',
  templateUrl: './mailbox-behaviours.component.html',
  styleUrls: ['./mailbox-behaviours.component.scss']
})
export class MailboxBehavioursComponent implements OnInit, OnDestroy {
  mailboxBehavioursForm: FormGroup;
  currentAgencyId: string;
  mailboxId: string;
  isMailboxFromSendGrid: boolean = false;
  private folders: IBehaviourFolder[] = [];
  public folderListResolved: IBehaviourFolder[] = [];
  public folderListDeleted: IBehaviourFolder[] = [];
  public mailBehavior: { deleted: string | null; resolved: string | null };
  mailboxSetting: IMailboxSetting;
  readonly EmailFolderPopup = EEmailFolderPopup;
  readonly MailboxRole = EUserMailboxRole;
  readonly MailboxSettingTab = EMailboxSettingTab;
  private destroy$ = new Subject<void>();
  public isConsole = false;
  public isSaveMailboxBeHaviours: boolean = false;
  public isRmEnvironment: boolean = false;
  public spamFolderId: string;
  public emailFolderId: string;
  public saveCategoryDocumentTypeForm: FormControl;
  public listCategoryTaskActivity: ICategoryTaskActivity[] = [];
  private subGetFolders: Subscription;
  private firstLoadFolders: boolean = false;
  public imageMapping: Record<
    Extract<keyof EmailProvider, 'GMAIL' | 'OUTLOOK'>,
    string
  > = {
    GMAIL: 'assets/images/login-gmail-logo.png',
    OUTLOOK: 'assets/images/login-outlook-logo.png'
  };
  public listImageMailbox = ['GMAIL', 'OUTLOOK'];
  public isShowGmailFolderPopup: boolean;
  public currentMailbox: IMailBox;
  public nestedFolders = [];
  constructor(
    private formBuilder: FormBuilder,
    private mailboxSettingApiService: MailboxSettingApiService,
    public mailboxSettingService: MailboxSettingService,
    public inboxService: InboxService,
    public loadingService: LoadingService,
    private sharedService: SharedService,
    private agencyService: AgencyDashboardService,
    private emailFolderService: EmailFolderService,
    private companyService: CompanyService,
    public folderService: FolderService,
    private activeRoute: ActivatedRoute
  ) {
    this.buildMailboxBehavioursForm();
  }

  get resolvedMessages() {
    return this.mailboxBehavioursForm.get('resolvedMessages');
  }

  get deletedMessages() {
    return this.mailboxBehavioursForm.get('deletedMessages');
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getInitialValuesAndInitalizeForm();
    this.subscribeValueFormChange();
    this.onTriggerSetEmailFolders();
    this.onEmailFolderIdChange();

    this.mailboxSettingApiService.isSaveConversationMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.isSaveMailboxBeHaviours = value;
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.saveCategoryDocumentTypeForm = this.formBuilder.control([null]);
    this.saveCategoryDocumentTypeForm.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleSaveMailBoxSyncTaskActivity();
      });
    this.mailboxSettingService
      .getListCategoryTaskActivity()
      .subscribe((listCategory) => {
        if (!listCategory?.length) return;
        this.listCategoryTaskActivity = listCategory;
      });
    this.prefillValueSaveMailboxActivity();
  }

  onEmailFolderIdChange() {
    this.emailFolderService.emailFolderId$
      .pipe(
        tap((emailFolderId: string) => {
          if (!emailFolderId) return;
          this.setEmailFolders(true);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((emailFolderId: string) => {
        const emailFolderAction = this.emailFolderService.emailFolderAction;
        if (
          !emailFolderId ||
          emailFolderAction === EEmailFolderPopup.TASK_FOLDER
        ) {
          return;
        }
        if (emailFolderAction === EEmailFolderPopup.RESOLVED_MESSAGE) {
          this.resolvedMessages.setValue(emailFolderId);
          this.emailFolderService.setEmailFolderAction(null);
        }
        if (emailFolderAction === EEmailFolderPopup.DELETED_MESSAGE) {
          this.deletedMessages.setValue(emailFolderId);
          this.emailFolderService.setEmailFolderAction(null);
        }
      });
  }

  subscribeValueFormChange() {
    this.mailboxBehavioursForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap((value) => {
          this.mapOptions();
          return this.saveMailboxBehaviours(value);
        })
      )
      .subscribe((response: ISaveMailboxBehavioursResponse) => {
        this.mailboxSettingService.setMailboxSetting({
          ...this.mailboxSetting,
          mailBehavior: response.mailBehavior
        });
      });
  }

  getInitialValuesAndInitalizeForm() {
    combineLatest([
      this.mailboxSettingService.currentAgencyId$.pipe(distinctUntilChanged()),
      this.activeRoute.queryParams,
      this.inboxService.listMailBoxs$,
      this.mailboxSettingService.mailboxSetting$
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([currentAgencyId, queryParams]) => {
          return !!currentAgencyId && !!queryParams;
        }),
        switchMap(
          ([currentAgencyId, queryParams, listMailBoxs, mailboxSetting]) => {
            const currentMailbox = listMailBoxs?.find(
              (mailbox) => mailbox?.id === queryParams['mailBoxId']
            );
            this.isMailboxFromSendGrid =
              currentMailbox?.provider === EmailProvider.SENDGRID;
            const mailboxId = queryParams['mailBoxId'];
            if (!currentMailbox) {
              return this.inboxService.listMailBoxs$.pipe(
                map((mailboxes) => {
                  const mailBoxRes = mailboxes.find(
                    (item) => item.id === queryParams['mailBoxId']
                  );

                  return {
                    currentAgencyId,
                    mailboxId,
                    mailBox: mailBoxRes,
                    mailboxSetting
                  };
                })
              );
            }
            return of({
              currentAgencyId,
              mailboxId,
              mailBox: currentMailbox,
              mailboxSetting
            });
          }
        ),
        switchMap(({ currentAgencyId, mailboxId, mailBox, mailboxSetting }) => {
          if (!mailboxSetting) {
            return this.getMailboxSettings().pipe(
              map((mailboxSettingRes) => {
                return {
                  currentAgencyId,
                  mailboxId,
                  mailBox,
                  mailboxSetting: mailboxSettingRes
                };
              })
            );
          }
          return of({ currentAgencyId, mailboxId, mailBox, mailboxSetting });
        }),
        tap(({ currentAgencyId, mailboxId, mailBox, mailboxSetting }) => {
          this.currentAgencyId = currentAgencyId;
          this.mailboxId = mailboxId;
          this.currentMailbox = mailBox;
          this.spamFolderId = mailBox?.spamFolder?.id;
          this.mailBehavior = mailboxSetting?.mailBehavior;
          this.mailboxSetting = mailboxSetting;
        })
      )
      .subscribe(() => {
        const folder = this.folderService.getEmailFolderByMailBoxId(
          this.mailboxId
        )?.tree;
        if (!folder) {
          this.inboxService.setRefreshEmailFolderMailBox(this.currentMailbox);
        }
        this.initializeMailboxBehavioursForm();
        if (!this.firstLoadFolders) {
          this.getEmailFolders();
        }
      });
  }

  filterFolder(item: IBehaviourFolder) {
    const outLookFolderToFilter = [
      LABEL_NAME_OUTLOOK.INBOX,
      LABEL_NAME_OUTLOOK.JUNK_EMAIL,
      LABEL_NAME_OUTLOOK.SENT_ITEMS
    ];

    const gmailFolderToFilter = [
      LABEL_EXTERNAL_ID_MAIL_BOX.SPAM,
      LABEL_EXTERNAL_ID_MAIL_BOX.SENT,
      LABEL_EXTERNAL_ID_MAIL_BOX.CHAT
    ];

    return (
      !outLookFolderToFilter.includes(item.wellKnownName) &&
      !gmailFolderToFilter.includes(item.externalId)
    );
  }

  mapOptions() {
    const mapFolders = (folders: IBehaviourFolder[], disableId: string) => {
      return folders.map((item) => {
        return {
          ...item,
          disabled: item.internalId === disableId
        };
      });
    };
    this.folderListResolved = mapFolders(
      this.folders,
      this.deletedMessages.value
    );
    this.folderListDeleted = mapFolders(
      this.folders,
      this.resolvedMessages.value
    );
  }

  setEmailFolders(reFlatten: boolean = false) {
    if (reFlatten || !this.folders.length) {
      this.nestedFolders =
        this.folderService.getEmailFolderByMailBoxId(this.mailboxId)?.tree ||
        [];
      this.folders =
        this.folderService
          .flattenTreeEmailFolder(this.nestedFolders, '', this.mailboxId)
          ?.filter((item) => {
            return this.filterFolder(item);
          }) || [];
    }
    this.mapOptions();
  }

  getEmailFolders() {
    if (this.subGetFolders) {
      this.subGetFolders.unsubscribe();
    }
    this.subGetFolders = this.folderService.emailFoldersLoaded.subscribe(
      (folder) => {
        if (!folder?.[this.mailboxId]) {
          this.firstLoadFolders = true;
        }
        this.setEmailFolders();
      }
    );
  }

  onTriggerSetEmailFolders() {
    this.folderService.triggerUpdateEmailFolders
      .pipe(takeUntil(this.destroy$), debounceTime(50))
      .subscribe((res) => {
        if (!res) return;
        this.setEmailFolders(true);
        if (
          !this.folders.some(
            (item) => item.internalId === this.deletedMessages?.value
          )
        ) {
          this.deletedMessages.setValue(null);
        }
        if (
          !this.folders.some(
            (item) => item.internalId === this.resolvedMessages?.value
          )
        ) {
          this.resolvedMessages.setValue(null);
        }
      });
  }

  buildMailboxBehavioursForm() {
    this.mailboxBehavioursForm = this.formBuilder.group({
      resolvedMessages: '',
      deletedMessages: ''
    });
  }

  initializeMailboxBehavioursForm(): void {
    this.mailboxBehavioursForm.setValue(
      {
        resolvedMessages: this.mailboxSetting?.mailBehavior?.resolved || null,
        deletedMessages: this.mailboxSetting?.mailBehavior?.deleted || null
      },
      { emitEvent: false }
    );
  }

  getMailboxSettings(): Observable<IMailboxSetting> {
    return this.mailboxSettingApiService.getMailboxSetting(this.mailboxId);
  }

  getMailboxBehavioursLabelLists(): Observable<IBehaviourFolder[]> {
    return this.mailboxSettingApiService.getMailboxBehavioursLabelLists(
      this.mailboxId
    );
  }

  saveMailboxBehaviours(value: {
    resolvedMessages: string;
    deletedMessages: string;
  }) {
    return this.mailboxSettingApiService.saveMailboxBehaviours(this.mailboxId, {
      ...this.mailBehavior,
      resolved: value.resolvedMessages || null,
      deleted: value.deletedMessages || null
    });
  }

  handleClosePopup() {
    this.isShowGmailFolderPopup = false;
  }

  handleAddEmailFolder(action: EEmailFolderPopup) {
    this.isShowGmailFolderPopup = true;
    this.emailFolderService.setEmailFolderAction(action);
  }

  prefillValueSaveMailboxActivity() {
    this.mailboxSettingService
      .getSaveMailboxSyncTaskActivity()
      .subscribe((data) => {
        const saveCategoryDocumentType =
          this.listCategoryTaskActivity?.find((item) => {
            return item.name === data?.saveCategoryDocumentType;
          })?.id || null;
        this.saveCategoryDocumentTypeForm.patchValue(saveCategoryDocumentType, {
          emitEvent: false
        });
      });
  }

  handleSaveMailBoxSyncTaskActivity() {
    const saveCategoryDocument = this.saveCategoryDocumentTypeForm.value;
    const fieldNameToSaveConversation = this.isRmEnvironment
      ? 'autoSyncConversationNote'
      : 'autoSyncConversationsToPT';
    const saveCategoryDocumentType =
      this.listCategoryTaskActivity?.find(
        (item) => item.id === saveCategoryDocument
      )?.name || null;

    this.mailboxSettingApiService
      .saveMailboxBehaviours(this.mailboxId, {
        [fieldNameToSaveConversation]: this.isSaveMailboxBeHaviours,
        resolved: this.resolvedMessages.value,
        deleted: this.deletedMessages.value,
        saveCategoryDocumentType
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.mailboxSettingApiService.isRefreshSaveConversationMailbox$.next(
          true
        );
      });
  }

  ngOnDestroy(): void {
    if (this.subGetFolders) this.subGetFolders.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

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
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { ShareValidators } from '@shared/validators/share-validator';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { EmailProvider } from '@shared/enum/inbox.enum';
import { EmailFolderService } from '@/app/dashboard/modules/inbox/components/gmail-folder-sidebar/services/email-folder.service';

@Component({
  selector: 'create-edit-gmail-folder-pop-up',
  templateUrl: './create-edit-gmail-folder-pop-up.component.html',
  styleUrls: ['./create-edit-gmail-folder-pop-up.component.scss']
})
export class CreateEditGmailFolderPopUpComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Output() onClose = new EventEmitter<void>();
  @Input() isVisible: boolean;
  @Input() currentGmailFolder;
  @Input() isCreateNewFolder: boolean;
  @Input() folders = [];
  @Input() mailBoxIdEmailFolder: string;

  isNestFolder: boolean;
  dissabledBtnConfirm: boolean;
  emailFolderForm: FormGroup;
  public isLoading = false;

  public listFolderFlat = [];
  public listOption = [];
  public maxLength: number;
  public isGmailProvider: boolean = false;
  public requireFolderName: boolean = false;
  private destroy$ = new Subject<void>();
  private mailBoxId: string;
  constructor(
    private dashboardApiService: DashboardApiService,
    private toastService: ToastrService,
    private inboxService: InboxService,
    private folderService: FolderService,
    private emailFolderService: EmailFolderService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folders'].currentValue) {
      this.listFolderFlat = this.folderService.flattenTreeEmailFolder(
        this.folders,
        this.currentGmailFolder?.id,
        this.mailBoxIdEmailFolder
      );
      if (this.folders?.[0]?.mailBox?.provider === EmailProvider.GMAIL) {
        this.isGmailProvider = true;
        this.listFolderFlat = this.listFolderFlat.filter(
          (item) => item.editAble
        );
      } else {
        this.isGmailProvider = false;
      }
      this.listOption = this.listFolderFlat?.filter((item) => !item.hidden);
    }
  }

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailBoxId) => {
        this.mailBoxId = mailBoxId;
      });
    this.emailFolderForm = new FormGroup({
      folderName: new FormControl(this.currentGmailFolder?.title ?? '', [
        Validators.required,
        ShareValidators.trimValidator
      ]),
      selectedFolder: new FormControl(
        this.currentGmailFolder?.id
          ? this.listFolderFlat.find(
              (item) => item.externalId === this.currentGmailFolder.parentId
            )
          : null
      )
    });
    if (this.emailFolderForm.value.selectedFolder) {
      this.isNestFolder = true;
      const countExternalNameLength =
        this.emailFolderForm.value.selectedFolder?.externalName?.length;
      this.maxLength = 224 - countExternalNameLength;
    }

    this.selectedFolder.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        if (items && this.isGmailProvider) {
          const countLength = items?.externalName?.length;
          this.maxLength = 224 - countLength;
          this.requireFolderName =
            this.maxLength <= 0
              ? true
              : this.folderName.value?.length > this.maxLength;
        }
      });

    this.folderName.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && this.isGmailProvider) {
          this.requireFolderName =
            this.maxLength <= 0 ? true : value?.length > this.maxLength;
        }
      });
  }

  get folderName() {
    return this.emailFolderForm?.get('folderName');
  }

  get selectedFolder() {
    return this.emailFolderForm?.get('selectedFolder');
  }

  public closeModal() {
    this.emailFolderForm.reset();
    this.emailFolderForm.markAsPristine();
    this.emailFolderForm.markAsUntouched();
    this.emailFolderForm.updateValueAndValidity();
    this.onClose.emit();
  }

  onCheckboxChange(event: boolean) {
    if (!event) {
      this.selectedFolder.clearValidators();
      this.requireFolderName = false;
      this.maxLength = 75; // default
    }
    this.isNestFolder = event;
    if (!this.isNestFolder && this.selectedFolder) this.selectedFolder.reset();
  }

  handleChangeValidator() {
    this.emailFolderForm.controls['selectedFolder'].setValidators([
      Validators.required
    ]);
    this.emailFolderForm.controls['selectedFolder'].updateValueAndValidity();
  }

  submit() {
    if (this.requireFolderName) {
      this.folderName.setErrors({ folderNameTooLong: true });
      this.emailFolderForm.markAllAsTouched();
      return;
    }
    this.emailFolderForm.markAllAsTouched();
    if (this.isNestFolder) {
      this.selectedFolder.setValidators([Validators.required]);
    } else {
      this.selectedFolder.clearValidators();
    }
    this.selectedFolder.updateValueAndValidity();
    if (this.emailFolderForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { folderName, selectedFolder } = this.emailFolderForm.value;
    const newParentFolder = this.listFolderFlat.find(
      (item) => item.internalId === selectedFolder?.internalId
    );
    const payload = {
      newFolderName: folderName?.trim()
    };
    if (selectedFolder) {
      payload['folderNestedId'] = selectedFolder.internalId;
    }

    if (
      !this.folderService.validateDuplicateTitle(
        this.currentGmailFolder?.id,
        newParentFolder?.id,
        payload.newFolderName,
        this.mailBoxIdEmailFolder
      )
    ) {
      this.folderName.setErrors({ exists: true });
      this.isLoading = false;
      return;
    }

    const handleResponse = (
      action: string,
      successMessage: string,
      errorMessage: string
    ) => ({
      next: (res) => {
        const { folder } = res;
        if (action === 'create') {
          this.folderService.createEmailFolder.next(folder);
          this.folderService.insertFolder(
            folder,
            newParentFolder,
            this.mailBoxIdEmailFolder
          );
          this.emailFolderService.setEmailFolderId(folder?.internalId);
        } else if (action === 'update') {
          const oldFolder = this.listFolderFlat.find(
            (item) => item.internalId === folder.id
          );
          this.folderService.updateFolder(
            folder,
            newParentFolder,
            oldFolder,
            this.mailBoxIdEmailFolder
          );
        }
        this.toastService.success(successMessage);
        this.isLoading = false;
        this.closeModal();
      },
      error: (err) => {
        if (err?.status === 400) {
          this.folderName.setErrors({ exists: true });
          this.isLoading = false;
          return;
        }
        this.toastService.error(errorMessage);
        this.closeModal();
      }
    });

    if (!this.isCreateNewFolder) {
      this.dashboardApiService
        .updateMailBoxFolder({
          ...payload,
          folderId: this.currentGmailFolder.internalId,
          mailBoxId: this.mailBoxIdEmailFolder
        })
        .subscribe(
          handleResponse('update', 'Folder edited', 'Folder edited failure')
        );
    } else {
      this.dashboardApiService
        .createMailBoxFolder({
          ...payload,
          mailBoxId: this.mailBoxIdEmailFolder || this.mailBoxId
        })
        .subscribe(
          handleResponse('create', 'Folder created', 'Folder created failure')
        );
    }
  }

  onChangeState(event) {
    this.isNestFolder = !!event;
    if (this.folderName.getError('exists')) {
      this.folderName.setErrors(null);
    }
  }

  ngOnDestroy() {
    this.currentGmailFolder = null;
    this.destroy$.next();
    this.destroy$.complete();
  }
}

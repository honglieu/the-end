import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IMailBox } from '@shared/types/user.interface';
import { Subject, filter, takeUntil } from 'rxjs';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { EMailBoxStatus, EmailProvider } from '@shared/enum/inbox.enum';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { EMAIL_VALIDATE } from '@services/constants';
import { SharedService } from '@services/shared.service';
import { ISharedMailboxForm } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

@Component({
  selector: 'shared-mailbox',
  templateUrl: './shared-mailbox.component.html',
  styleUrls: ['./shared-mailbox.component.scss']
})
export class SharedMailboxComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onSave: EventEmitter<ISharedMailboxForm> =
    new EventEmitter<ISharedMailboxForm>();
  private unsubscribe = new Subject<void>();
  public listOwnerOutlook: IMailBox[] = [];
  public sharedMailboxForm: FormGroup;
  public isConsole: boolean = false;
  public checkSubmit: boolean = true;
  constructor(
    private inboxService: InboxService,
    private formBuilder: FormBuilder,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.initForm();
    this.inboxService.listMailBoxs$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => !!res)
      )
      .subscribe((mailbox) => {
        this.listOwnerOutlook = (mailbox || [])
          .filter((item) => {
            const isActiveOutlookMailbox =
              item?.status === EMailBoxStatus.ACTIVE &&
              item?.provider === EmailProvider.OUTLOOK;

            const isOwnerOutlookMailbox = this.isConsole
              ? isActiveOutlookMailbox
              : item?.role.includes(EUserMailboxRole.OWNER) &&
                isActiveOutlookMailbox;

            return isOwnerOutlookMailbox;
          })
          .sort((a, b) => {
            const nameA = a?.name?.toUpperCase();
            const nameB = b?.name?.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            return nameA > nameB ? 1 : 0;
          });

        if (this.listOwnerOutlook.length === 1) {
          this.ownerMailBox.setValue(this.listOwnerOutlook[0]?.id);
        }
      });

    this.sharedMailboxForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.checkSubmit = true;
      });
  }

  private initForm() {
    this.sharedMailboxForm = this.formBuilder.group({
      ownerMailBox: new FormControl(null, [Validators.required]),
      sharedMailbox: new FormControl('', [
        this.validateCompanyEmail(),
        Validators.required
      ])
    });
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  onSubmit() {
    this.checkSubmit = false;
    if (this.sharedMailboxForm.invalid) {
      this.sharedMailboxForm.markAllAsTouched();
      return;
    }
    const ownerMailBox = this.ownerMailBox.value;
    const sharedMailbox = this.sharedMailbox.value;
    const data = {
      ownerMailBox,
      sharedMailbox
    };
    this.onSave.emit(data);
  }

  validateCompanyEmail(): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && !this.validateEmail(control.value)) {
        return { ['Email' + ' ']: null };
      }
      return null;
    };
  }

  validateEmail(email: string): boolean {
    const regexEmail = EMAIL_VALIDATE;
    return regexEmail.test(email);
  }

  customSearchFn(term: string, item) {
    term = term.toLowerCase();
    return (
      item?.name?.toLowerCase()?.includes(term) ||
      item?.emailAddress?.toLowerCase()?.includes(term)
    );
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  get ownerMailBox() {
    return this.sharedMailboxForm.get('ownerMailBox');
  }

  get sharedMailbox() {
    return this.sharedMailboxForm.get('sharedMailbox');
  }
}

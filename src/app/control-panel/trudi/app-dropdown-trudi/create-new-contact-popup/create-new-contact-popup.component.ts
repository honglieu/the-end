import { TaskService } from '@services/task.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ContactType } from '@shared/enum/contact-type';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationService } from '@services/conversation.service';
import { UserService } from '@services/user.service';
import {
  CreateNewContactUserResponse,
  IUserParticipant
} from '@shared/types/user.interface';
import { AgencyService } from '@services/agency.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ECreatedFrom } from '@shared/enum/messageType.enum';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'create-new-contact-popup',
  templateUrl: './create-new-contact-popup.component.html',
  styleUrls: ['./create-new-contact-popup.component.scss']
})
export class CreateNewContactPopupComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() show = false;
  @Input() participant: IUserParticipant;
  @Input() isReassign: boolean;
  @Output() onClose = new EventEmitter<CreateNewContactUserResponse>();
  public email: string;
  public phoneNumber: string;
  public headerTitle: string;
  public isSubmit: boolean = false;
  public createContactForm: FormGroup;
  public contactTypeArray = [
    {
      id: ContactType.ADVERTISING_SITES,
      name: 'Advertising sites'
    },
    {
      id: ContactType.BANKS,
      name: 'Banks'
    },
    {
      id: ContactType.BODY_CORPORATES,
      name: 'Body corporates'
    },
    {
      id: ContactType.COURTS,
      name: 'Courts'
    },
    {
      id: ContactType.NEIGHBOURS,
      name: 'Neighbours'
    },
    {
      id: ContactType.SOFTWARE_COMPANY,
      name: 'Software company'
    },
    {
      id: ContactType.INSURANCE_COMPANY,
      name: 'Insurance company'
    },
    {
      id: ContactType.DOCUSIGN,
      name: 'DocuSign'
    },
    {
      id: ContactType.OTHER,
      name: 'Other'
    }
  ];

  public roleArray = [
    {
      id: EUserPropertyType.SUPPLIER,
      name: 'Supplier'
    },
    {
      id: EUserPropertyType.OTHER,
      name: 'Other contact'
    }
  ];

  EUserPropertyType = EUserPropertyType;

  private subscribe = new Subject<void>();
  public isConsole: boolean;
  constructor(
    public inboxService: InboxService,
    private conversationService: ConversationService,
    private userService: UserService,
    private agencyService: AgencyService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.createContactForm = new FormGroup({
      contactName: new FormControl('', Validators.required),
      role: new FormControl(null, Validators.required),
      contactType: new FormControl('')
    });

    // this.conversationService.trudiResponseConversation
    //   .pipe(takeUntil(this.subscribe))
    //   .subscribe((conversation) => {
    //     if (conversation?.trudiResponse?.data) {
    //       this.email = conversation.trudiResponse?.data[0]?.header?.email;
    //       this.phoneNumber =
    //         conversation.trudiResponse?.data[0]?.header?.phoneNumber;
    //     }
    //   });

    this.role.valueChanges
      .pipe(takeUntil(this.subscribe))
      .subscribe((value) => {
        if (value === EUserPropertyType.OTHER) {
          this.contactType.addValidators(Validators.required);
        } else {
          this.contactType.removeValidators(Validators.required);
        }
        this.contactType.setValue('');
        this.contactType.markAsPristine();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const { isReassign, participant } = changes;
    if (participant?.currentValue) {
      const {
        createdFrom,
        email,
        secondaryEmail,
        phoneNumberFromConversationLog,
        phoneNumber
      } = this.participant;

      if (createdFrom === ECreatedFrom.VOICE_MAIL) {
        this.phoneNumber = phoneNumberFromConversationLog || phoneNumber;
      } else {
        this.email = isReassign ? secondaryEmail || email : email;
      }
    }
  }

  get contactName() {
    return this.createContactForm.get('contactName');
  }

  get role() {
    return this.createContactForm.get('role');
  }

  get contactType() {
    return this.createContactForm.get('contactType');
  }

  submit() {
    this.isSubmit = true;
    if (this.createContactForm.invalid) {
      if (this.role.value === EUserPropertyType.OTHER) {
        this.createContactForm.markAllAsTouched();
      } else {
        this.contactName.markAllAsTouched();
        this.role.markAllAsTouched();
      }
      return;
    }

    this.userService
      .createNewContact(
        this.phoneNumber ? null : this.email,
        this.phoneNumber,
        this.contactName.value,
        this.role.value,
        this.contactType.value,
        this.taskService.currentTask$.value?.agencyId
      )
      .subscribe({
        next: (res: CreateNewContactUserResponse) => {
          this.close(res);
        },
        error: (err) => {
          if (err.error?.message?.includes('already exists')) {
            this.contactName.setErrors({ exists: true });
            this.cdr.markForCheck();
          }
        }
      });
  }

  close(contact?: CreateNewContactUserResponse) {
    this.isSubmit = false;
    this.contactName.setErrors(null);
    this.createContactForm.setValue({
      contactName: '',
      role: null,
      contactType: ''
    });
    this.createContactForm.markAsPristine();
    this.createContactForm.markAsUntouched();
    this.createContactForm.updateValueAndValidity();

    this.onClose.emit(contact);
  }

  ngOnDestroy() {
    this.subscribe.next();
    this.subscribe.complete();
  }
}

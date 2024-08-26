import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import {
  ContactType,
  EUserPropertyType,
  EMessageComeFromType,
  EConversationType
} from '@shared/enum';
import {
  IUserParticipant,
  CreateNewContactUserResponse
} from '@shared/types/user.interface';
import { ShareValidators } from '@shared/validators/share-validator';
import {
  ChangeDetectionStrategy,
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
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'create-new-contact-popup',
  templateUrl: './create-new-contact-popup.component.html',
  styleUrls: ['./create-new-contact-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateNewContactPopupComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() show = false;
  @Input() participant: IUserParticipant & {
    fromPhoneNumber?: string;
    conversationType?: EConversationType;
    channelUserId?: string;
  };
  @Input() isReassign: boolean;
  @Output() onClose = new EventEmitter<CreateNewContactUserResponse>();

  public email: string;
  public phoneNumber: string;
  public headerTitle: string;
  public isSubmit: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public isConsole: boolean;
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
  private subscribe = new Subject<void>();

  readonly EUserPropertyType = EUserPropertyType;
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly EConversationType = EConversationType;

  private commonControls = {
    contactName: new FormControl('', Validators.required),
    role: new FormControl(null, Validators.required),
    contactType: new FormControl('')
  };

  private defaultValueFormControl = {
    contactName: '',
    role: null,
    contactType: ''
  };

  constructor(
    public readonly inboxService: InboxService,
    private readonly userService: UserService,
    private readonly taskService: TaskService,
    private readonly cdr: ChangeDetectorRef,
    public readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    if (
      this.participant.conversationType !== EConversationType.MESSENGER &&
      this.participant.conversationType !== EConversationType.WHATSAPP
    ) {
      this.inboxService
        .getIsDisconnectedMailbox()
        .pipe(takeUntil(this.subscribe))
        .subscribe((isDisconnectedMailbox) => {
          this.isDisconnectedMailbox = isDisconnectedMailbox;
        });
    }

    this.handleFillEmail();
    this.createContactForm = new FormGroup(this.commonControls);

    this.createContactForm.valueChanges
      .pipe(takeUntil(this.subscribe))
      .subscribe(() => {
        this.isSubmit = false;
      });

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

  handleFillEmail() {
    const { VOICE_MAIL, SMS, WHATSAPP, MESSENGER } = EConversationType;
    const { conversationType, emailVerified } = this.participant;

    if ([VOICE_MAIL, SMS, MESSENGER, WHATSAPP].includes(conversationType)) {
      const isSupportedChannel = [MESSENGER, SMS, WHATSAPP].includes(
        conversationType
      );

      this.commonControls['email'] = new FormControl(
        {
          value: isSupportedChannel && emailVerified ? emailVerified : '',
          disabled: isSupportedChannel && !!emailVerified
        },
        [Validators.required, ShareValidators.email()]
      );

      this.defaultValueFormControl['email'] =
        isSupportedChannel && emailVerified ? emailVerified : '';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const { isReassign, participant } = changes;
    if (participant?.currentValue) {
      const {
        conversationType,
        email,
        secondaryEmail,
        phoneNumberFromConversationLog,
        phoneNumber,
        fromPhoneNumber
      } = this.participant;
      switch (conversationType) {
        case EConversationType.VOICE_MAIL:
          this.phoneNumber =
            phoneNumberFromConversationLog || phoneNumber || fromPhoneNumber;
          break;
        case EConversationType.WHATSAPP:
        case EConversationType.SMS:
          this.phoneNumber = fromPhoneNumber;
          break;
        default:
          this.email = isReassign ? secondaryEmail || email : email;
          break;
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

  get formControlEmail(): AbstractControl {
    return this.createContactForm.get('email');
  }

  submit() {
    this.isSubmit = true;
    if (this.createContactForm.invalid) {
      if (this.role.value === EUserPropertyType.OTHER) {
        this.createContactForm.markAllAsTouched();
      } else {
        this.contactName.markAllAsTouched();
        this.role.markAllAsTouched();
        this.formControlEmail?.markAllAsTouched();
      }
      return;
    }

    const emailPayloadCreateNewContact = [
      EConversationType.VOICE_MAIL,
      EConversationType.SMS,
      EConversationType.WHATSAPP,
      EConversationType.MESSENGER
    ].includes(this.participant.conversationType)
      ? this.formControlEmail?.value
      : this.phoneNumber
      ? null
      : this.email;

    this.userService
      .createNewContact(
        emailPayloadCreateNewContact,
        this.phoneNumber,
        this.contactName.value,
        this.role.value,
        this.contactType.value,
        this.taskService.currentTask$.value?.agencyId,
        this.participant.channelUserId
      )
      .subscribe({
        next: (res: CreateNewContactUserResponse) => {
          this.close(res);
        },
        error: (err) => {
          if (err.error?.message?.includes('already exists')) {
            this.contactName.setErrors({ exists: true });
            this.cdr.detectChanges();
          }
        }
      });
  }

  close(contact?: CreateNewContactUserResponse) {
    this.isSubmit = false;
    this.contactName.setErrors(null);
    this.createContactForm.setValue(this.defaultValueFormControl);
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

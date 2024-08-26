import { TaskService } from './../../../../../services/task.service';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgencyService } from '@services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { UserService } from '@services/user.service';
import { ContactType } from '@shared/enum/contact-type';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { CreateNewContactUserResponse } from '@shared/types/user.interface';

@Component({
  selector: 'create-new-contact-popup',
  templateUrl: './create-new-contact-popup.component.html',
  styleUrls: ['./create-new-contact-popup.component.scss']
})
export class CreateNewContactPopupComponent implements OnInit {
  @Input() show = false;
  @Output() onClose = new EventEmitter<CreateNewContactUserResponse>();
  public isShowWarningMessage: boolean = false;
  public email: string;
  public phoneNumber: string;
  public createContactForm: FormGroup;
  public contactTypeArray = [
    {
      id: ContactType.ADVERTISING_SITES,
      name: 'Advertising Sites'
    },
    {
      id: ContactType.BANKS,
      name: 'Banks'
    },
    {
      id: ContactType.BODY_CORPORATES,
      name: 'Body Corporates'
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
      name: 'Software Company'
    },
    {
      id: ContactType.INSURANCE_COMPANY,
      name: 'Insurance Company'
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

  roleArray = [
    {
      id: EUserPropertyType.SUPPLIER,
      name: 'Supplier'
    },
    {
      id: EUserPropertyType.OTHER,
      name: 'Other Contact'
    }
  ];

  EUserPropertyType = EUserPropertyType;

  private subscribe = new Subject<void>();
  constructor(
    private conversationService: ConversationService,
    private userService: UserService,
    private taskService: TaskService,
    private agencyService: AgencyService
  ) {}

  ngOnChanges(changes: SimpleChanges) {}

  ngOnInit(): void {
    this.createContactForm = new FormGroup({
      contactName: new FormControl('', Validators.required),
      role: new FormControl(null, Validators.required),
      contactType: new FormControl('')
    });
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.subscribe))
      .subscribe((conversation) => {
        if (conversation?.trudiResponse?.data) {
          this.email = conversation.trudiResponse?.data[0]?.header?.email;
          this.phoneNumber =
            conversation.trudiResponse?.data[0]?.header?.phoneNumber;
        }
      });

    this.createContactForm.valueChanges
      .pipe(takeUntil(this.subscribe))
      .subscribe((value) => {
        this.isShowWarningMessage = false;
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
    if (!((this.email || this.phoneNumber) && this.createContactForm.valid)) {
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
      .subscribe(
        (res: CreateNewContactUserResponse) => {
          this.close(res);
        },
        (err) => {
          if (err.error?.message?.status === 400) {
            this.isShowWarningMessage = true;
          }
        }
      );
  }

  close(contact?: CreateNewContactUserResponse) {
    this.createContactForm.reset();
    this.onClose.emit(contact);
    this.isShowWarningMessage = false;
  }

  ngOnDestroy() {
    this.subscribe.next();
    this.subscribe.complete();
  }
}

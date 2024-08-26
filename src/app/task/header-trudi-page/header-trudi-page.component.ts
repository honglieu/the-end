import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { UserConversation } from '@shared/types/conversation.interface';

@Component({
  selector: 'header-trudi-page',
  templateUrl: './header-trudi-page.component.html',
  styleUrls: ['./header-trudi-page.component.scss']
})
export class HeaderTrudiPageComponent implements OnChanges, OnInit {
  @Input() size: number;
  @Input() title: string;
  @Input() text: string;
  @Input() email: string;
  @Input() phoneNumber: string;
  @Input() isHideLogo: boolean = true;
  @Input() isUnindentifiedEmail: boolean;
  @Input() isUnindentifiedPhoneNumber: boolean;
  @Input() isSelectContact: boolean = false;
  @Input() identifiedEmail: string;
  @Input() appChatHeader: boolean;
  @Input() currentConversation: UserConversation;
  public reminder: string;
  public textIdentifiedEmail: string;
  public isRmEnvironment: boolean = false;
  private unsubscribe = new Subject<void>();

  get unrecognisedTitle() {
    return `Unrecognised ${
      this.isUnindentifiedEmail ? 'email' : 'phone number'
    }`;
  }

  constructor(
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}
  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['email']?.currentValue || changes['text']?.currentValue) {
      this.handleEmailRemainder();
    }
    if (changes['currentConversation']?.currentValue) {
      this.isUnindentifiedPhoneNumber =
        this.currentConversation?.trudiResponse?.data?.[0]?.body?.isUnindentifiedPhoneNumber;
      this.isUnindentifiedEmail =
        this.currentConversation?.trudiResponse?.data?.[0]?.body?.isUnindentifiedEmail;
    }
  }

  handleEmailRemainder() {
    this.reminder = this.email ? this.text.replace(this.email, '') : this.text;
    this.textIdentifiedEmail = this.identifiedEmail
      ? this.identifiedEmail?.replace('@email', '')
      : this.reminder;

    if (this.appChatHeader) {
      this.textIdentifiedEmail = this.textIdentifiedEmail?.replace(/\.+$/, '');
    }
  }
}

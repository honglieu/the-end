import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { EmailProvider } from '@shared/enum/inbox.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import {
  EventsToggle,
  IEvents,
  eventsCreated,
  eventsSyncedPT,
  eventsSyncedRM
} from '@/app/profile-setting/integrations/constants/constants';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'select-events-provider',
  templateUrl: './select-events-provider.component.html',
  styleUrls: ['./select-events-provider.component.scss']
})
export class SelectEventsProviderComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() provider: EmailProvider;
  @Input() userCalendarId: string;
  @Input() config: string;
  @Input() status: EIntegrationsStatus;
  public eventsSyncedPT = eventsSyncedPT;
  public eventsSyncedRM = eventsSyncedRM;
  public eventsCreated = eventsCreated;
  public title: string;
  public isRMEnvironment: boolean = false;
  public formData = {};
  public EIntegrationsStatus = EIntegrationsStatus;
  private unsubscribe = new Subject<void>();
  constructor(
    public toastService: ToastrService,
    private userService: UserService,
    private readonly agencyDashboardService: AgencyService,
    private integrationsService: IntegrationsService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRMEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
    this.integrationsService
      .getIntegrationsCalendarStatus()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => (this.status = status));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['provider']?.currentValue) {
      this.getTitle();
    }
    if (changes && changes['config']?.currentValue) {
      const updateEvents = (eventList: EventsToggle[]) => {
        eventList.forEach((event) => {
          if (this.config[event.key] !== undefined) {
            event.isChecked = this.config[event.key];
          }
        });
      };
      updateEvents(eventsCreated);
      if (this.isRMEnvironment) {
        updateEvents(eventsSyncedRM);
      } else {
        updateEvents(eventsSyncedPT);
      }
    }
  }

  addEventToCalendar() {
    const body = { config: this.formData as IEvents };
    this.userService.addEventToCalendar(this.userCalendarId, body).subscribe({
      next: () => {
        this.integrationsService.setPopupState({
          showPopupSelectEvents: false
        });
        this.integrationsService.getIntegrationsData();
      },
      error: (error) => {
        this.toastService.error(error?.error?.message);
      }
    });
  }

  onCancel() {
    this.integrationsService.setPopupState({
      showPopupSelectEvents: false
    });
  }

  onSave() {
    this.addEventToCalendar();
  }

  onValueChange(e) {
    this.formData = { ...this.formData, ...e };
  }

  itemTrackBy(index: number) {
    return index;
  }

  getTitle() {
    return this.provider === EmailProvider.GOOGLE
      ? (this.title = 'Select events to add to Google calendar')
      : (this.title = 'Select events to add to Outlook calendar');
  }

  get popupState() {
    return this.integrationsService.getPopupState();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

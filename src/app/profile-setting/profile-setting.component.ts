import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderService } from '@services/header.service';
import { ProfileSettingService } from '@services/profile-setting.service';
import { PropertiesService } from '@services/properties.service';
import { UserService } from '@services/user.service';
import { TrudiTab } from '@trudi-ui';
import { ActionLinkService } from '@services/action-link.service';

@Component({
  selector: 'app-profile-setting',
  templateUrl: './profile-setting.component.html',
  styleUrls: ['./profile-setting.component.scss']
})
export class ProfileSettingComponent implements OnInit, AfterViewInit {
  private destroy$ = new Subject<void>();
  private previousUrl = '';

  constructor(
    private readonly router: Router,
    private profileSettingService: ProfileSettingService,
    public userSerivce: UserService,
    private headerService: HeaderService,
    private propertyService: PropertiesService,
    private actionLinkService: ActionLinkService,
    private propertiesService: PropertiesService
  ) {}

  menuItems: TrudiTab<unknown>[] = [
    {
      title: 'Public profile',
      link: 'public-profile',
      icon: 'userMailboxSetting'
    },
    {
      title: 'Account settings',
      link: 'account-settings',
      icon: 'roleMailboxSetting'
    },
    {
      title: 'Portfolios',
      link: 'portfolios',
      icon: 'contactMailboxSetting'
    },
    {
      title: 'Notifications',
      link: 'notification',
      icon: 'bellMailboxSetting'
    },
    {
      title: 'Integrations',
      link: 'integrations',
      icon: 'linkMailboxSetting'
    },
    {
      title: 'Appointment availability',
      link: 'appointment-availability',
      icon: 'briefcaseMailboxSetting'
    }
  ];

  public leaveWarning: boolean = false;
  public routeTarget: string = '';
  isRmEnvironment: boolean = false;

  ngOnInit(): void {
    this.propertiesService.init();
    this.profileSettingService.editAppointmenting.asObservable().subscribe({
      next: (res) => {
        this.leaveWarning = res;
      }
    });
    this.actionLinkService.previousUrl$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((url) => {
        this.previousUrl = url;
      });
  }

  ngAfterViewInit(): void {
    this.hideDropdownMenu();
  }

  hideDropdownMenu() {
    const bg = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    if (bg) bg.click();
  }

  clickLink(route, event: Event) {
    this.routeTarget = route;
    if (this.router.url === '/user-setting/appointment-availability') {
      if (this.profileSettingService.editAppointmenting.getValue()) {
        this.leaveWarning = true;
      } else {
        event.preventDefault();
        this.router.navigate([this.routeTarget]);
      }
    }
  }

  onClose() {
    this.profileSettingService.editAppointmenting.next(false);
  }

  redirect() {
    this.profileSettingService.leaveWarning.next(true);
    this.profileSettingService.editAppointmenting.next(false);
  }

  goBack() {
    if (
      this.router.url === '/user-setting/appointment-availability' &&
      this.profileSettingService.editAppointmenting.getValue()
    ) {
      this.leaveWarning = true;
      this.routeTarget = '/dashboard';
      return;
    }
    this.redirectDashboard();
  }

  redirectDashboard() {
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      currentTask: null
    });

    this.router.navigateByUrl(`/dashboard`);
  }

  handleClick() {
    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    } else {
      this.router.navigate(['/dashboard', 'inbox']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.propertyService.destroy();
  }
}

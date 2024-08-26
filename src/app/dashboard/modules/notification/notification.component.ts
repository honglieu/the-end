import { trigger, transition, useAnimation } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  closeNotification,
  openNotification
} from '@/app/dashboard/animation/triggerNotificationAnimation';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ActionLinkService } from '@services/action-link.service';
import { Router } from '@angular/router';

@Component({
  selector: 'notification-v2',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [useAnimation(openNotification)]),

      transition(':leave', [useAnimation(closeNotification)])
    ])
  ]
})
export class NotificationComponent implements OnInit {
  @ViewChild('notificationContent')
  notificationContent?: ElementRef<HTMLDivElement>;
  isShowNotification: boolean = false;
  isShowNotificationBS;
  public destroyRef: () => void;
  private unsubscribe = new Subject<void>();
  public previousUrl: string = '';
  constructor(
    private dashboardApiService: DashboardApiService,
    private agencyService: AgencyService,
    private actionLinkService: ActionLinkService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeIsShowNotification();
    this.actionLinkService.previousUrl$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((url) => {
        this.previousUrl = url;
      });
  }

  handleClick(event) {
    this.actionLinkService.setPreviousUrl(this.previousUrl);
    this.router.navigate([`/dashboard/profile-settings/notification`]);
    this.isShowNotification = false;
  }

  subscribeIsShowNotification() {
    this.isShowNotificationBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isOpen) => (this.isShowNotification = isOpen));
  }

  handleAnimationEnd(): void {
    if (!this.isShowNotification) this.destroyRef();
  }

  ngAfterViewInit(): void {
    this.notificationContent?.nativeElement?.focus();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

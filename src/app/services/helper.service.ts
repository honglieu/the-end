import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EAppMessageCreateType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(private router: Router) {}

  public get isInboxDetail(): boolean {
    return this.router.url.includes('inbox/detail');
  }

  public get isDashboardInbox(): boolean {
    return this.router.url.includes('dashboard/inbox');
  }

  public get isDashboardTask(): boolean {
    return this.router.url.includes('dashboard/task');
  }

  public get isDashboardEvent(): boolean {
    return this.router.url.includes('dashboard/event');
  }

  public get isDashboardContact(): boolean {
    return this.router.url.includes('dashboard/contacts');
  }

  public get isDashboardInsight(): boolean {
    return this.router.url.includes('dashboard/insights');
  }

  public get isNewMessageCompose(): boolean {
    const url = this.router.url;
    return (
      !url.includes(EAppMessageCreateType.NewAppMessageDone) &&
      url.includes(EAppMessageCreateType.NewAppMessage)
    );
  }
}

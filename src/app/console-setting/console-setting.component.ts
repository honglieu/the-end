import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ActionLinkService } from '@services/action-link.service';
import { LoaderService } from '@services/loader.service';
import { UserService } from '@services/user.service';
import { IRouterSidebar } from '@shared/types/share.model';

@Component({
  selector: 'console-setting',
  templateUrl: './console-setting.component.html',
  styleUrls: ['./console-setting.component.scss']
})
export class ConsoleSettingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public listItem: IRouterSidebar[] = [
    {
      title: 'Agent management',
      link: 'agent-management',
      icon: 'tenancyMailboxSetting'
    },
    {
      title: 'Tasks',
      link: 'task-editor',
      icon: 'taskNameSetting'
    },
    {
      title: 'Companies',
      link: 'agencies-management',
      icon: 'buildingSetting'
    },
    {
      title: 'Promotions',
      link: 'promotions',
      icon: 'promotionMailboxSetting'
    }
  ];
  private _url: string = '';
  constructor(
    private readonly ld: LoaderService,
    private readonly router: Router,
    private readonly actionLinkService: ActionLinkService,
    public userSerivce: UserService
  ) {}

  ngOnInit(): void {
    this.ld.removeLoadingLayer();
  }

  handleExit() {
    const preUrl = this.actionLinkService.preUrl;
    if (preUrl) {
      this.router.navigateByUrl(preUrl);
    } else {
      const targetUrl = this._url || `dashboard`;
      this.router.navigateByUrl(targetUrl);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

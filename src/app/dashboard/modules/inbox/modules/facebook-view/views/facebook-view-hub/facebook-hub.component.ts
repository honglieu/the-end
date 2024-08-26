import { Component, OnDestroy, OnInit } from '@angular/core';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { combineLatest, debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { EPageMessengerConnectStatus } from '@/app/dashboard/shared/types/facebook-account.interface';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'facebook-view-hub',
  templateUrl: './facebook-hub.component.html'
})
export class FacebookViewHubComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  constructor(
    public readonly facebookService: FacebookService,
    private readonly router: Router,
    private readonly activeRouter: ActivatedRoute,
    private readonly facebookAccountService: FacebookAccountService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.facebookService.facebookMessengerSelected$,
      this.activeRouter.queryParams
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([messager, queryParams]) => {
        this.facebookService.setFacebookConnected(
          !!messager || !!queryParams['channelId']
        );
      });

    combineLatest([
      this.facebookAccountService.currentPageMessengerActive$,
      this.activeRouter.queryParams
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          ([currentPageMessengerActive, queryParams]) =>
            !queryParams['channelId'] &&
            currentPageMessengerActive?.status ===
              EPageMessengerConnectStatus.ACTIVE
        ),
        debounceTime(300)
      )
      .subscribe(([currentPageMessengerActive]) => {
        this.router.navigate([], {
          queryParams: {
            channelId: currentPageMessengerActive.id
          },
          queryParamsHandling: 'merge'
        });
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

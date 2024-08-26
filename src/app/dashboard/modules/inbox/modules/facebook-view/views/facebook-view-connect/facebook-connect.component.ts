import { Subject, filter, takeUntil } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { FacebookSteps } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import {
  FacebookOpenFrom,
  FacebookPage
} from '@/app/dashboard/shared/types/facebook-account.interface';
import { ToastrService } from 'ngx-toastr';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { PermissionService } from '@/app/services/permission.service';
import { Router } from '@angular/router';

@Component({
  selector: 'facebook-view-connect',
  templateUrl: './facebook-connect.component.html',
  styleUrl: './facebook-connect.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('textAnimation', [
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(0px)' }),
        animate(
          '150ms ease-in',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition('* => void', [
        animate(
          '150ms ease-out',
          style({ opacity: 0, transform: 'translateY(0px)' })
        )
      ])
    ])
  ]
})
export class FacebookViewConnectComponent implements OnInit, OnDestroy {
  @Input() isShow: boolean = false;
  public currentStep = FacebookSteps.Initial;
  public facebookPageData: FacebookPage;
  public facebookPageForm: FormGroup;
  public isHasFeatureMessenger: boolean = false;
  public isPermissionEdit: boolean = false;
  public textContentForSuccessPopup: string;
  private destroy$ = new Subject<void>();
  readonly FacebookSteps = FacebookSteps;

  get facebookPageControl() {
    return this.facebookPageForm?.get('facebookPage');
  }

  get facebookTooltipContent() {
    return `Your Messenger feature is turned OFF. ${
      this.permissionService?.isOwner || this.permissionService?.isAdministrator
        ? ''
        : 'Please contact your administrator.'
    }`;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly facebookService: FacebookService,
    private readonly toastrService: ToastrService,
    private readonly agencyService: AgencyService,
    private readonly permissionService: PermissionService,
    public readonly facebookAccountService: FacebookAccountService,
    private readonly router: Router
  ) {
    this.facebookPageForm = this.fb.group({
      facebookPage: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.subscribeToShowSelectFacebookPage();
    this.subscribeToFacebookPages();
    this.subscribeCurrentPlan();
    this.checkPermission();
  }

  private subscribeToShowSelectFacebookPage(): void {
    this.facebookAccountService.showSelectFacebookPage$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res.state && res.openFrom === FacebookOpenFrom.inbox)
      )
      .subscribe(() => {
        this.currentStep = FacebookSteps.Confirmation;
      });
  }

  private subscribeToFacebookPages(): void {
    this.facebookAccountService.facebookPages$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res && res.openFrom === FacebookOpenFrom.inbox)
      )
      .subscribe((res) => {
        if (res?.data?.length === 1) {
          this.facebookPageControl.setValue(res.data[0].id);
        }

        this.facebookPageData = {
          ...res,
          option:
            res.data?.map((item) => ({
              value: item.id,
              label: item.name
            })) || []
        };
      });
  }

  subscribeCurrentPlan() {
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isHasFeatureMessenger = res?.features[EAddOnType.MESSENGER].state;
      });
  }

  checkPermission() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
  }

  loginMessenger(): void {
    if (!this.isPermissionEdit || !this.isHasFeatureMessenger) return;
    this.facebookAccountService.login(FacebookOpenFrom.inbox).subscribe();
  }

  handleCancel(): void {
    this.facebookAccountService.logout();
    this.facebookPageControl.setValue(null);
    this.currentStep = FacebookSteps.Initial;
    this.facebookAccountService.reset();
    this.facebookPageForm.reset();
  }

  handleConfirm(): void {
    this.facebookPageControl.markAsTouched();
    if (this.facebookPageControl.invalid) return;

    const pageSelected = this.facebookPageData.data?.find(
      (item) => item.id === this.facebookPageControl.value
    );
    const payload = {
      pageId: pageSelected.id,
      name: pageSelected.name,
      avatar: pageSelected.picture?.data?.url,
      accessToken: this.facebookPageData.userInfo.accessToken,
      userId: this.facebookPageData.userInfo.userId
    };
    // Call api to save token facebook page
    this.facebookAccountService.integrateFacebookPageApi(payload).subscribe({
      next: (res) => {
        if (!res) return;
        this.textContentForSuccessPopup = `The Messenger account for ${res.dataValues?.name} has been successfully
          added to your Trudi® inbox. Please note you'll only see messages received from this point onwards. You won't see any messages before integrating with Trudi®`;
        this.currentStep = FacebookSteps.Success;
        this.facebookAccountService.reset();
        this.router.navigate([], {
          queryParams: {
            channelId:
              this.facebookAccountService.currentPageMessengerActive$.value?.id
          },
          queryParamsHandling: 'merge'
        });
      },
      error: (err) => {
        this.facebookAccountService.reset();
        if (err?.error?.message) this.toastrService.error(err.error.message);
      }
    });
  }

  handleCloseAll(): void {
    this.facebookService.setFacebookConnected(true);
    this.currentStep = FacebookSteps.Initial;
    this.facebookPageForm.reset();
  }

  handleDone(): void {
    this.facebookService.setFacebookConnected(true);
    this.currentStep = FacebookSteps.Initial;
    this.facebookPageForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

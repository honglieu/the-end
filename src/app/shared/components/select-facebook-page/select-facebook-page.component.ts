import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EMailBoxStatus,
  EMailBoxType,
  GroupType,
  TaskStatusType
} from '@/app/shared/enum';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { Subject, filter, takeUntil } from 'rxjs';
import {
  FacebookOpenFrom,
  FacebookPageData,
  FacebookPageOptionType,
  FacebookPayloadIntegrateType,
  FacebookUserInfoType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import { ToastrService } from 'ngx-toastr';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'select-facebook-page',
  templateUrl: './select-facebook-page.component.html',
  styleUrl: './select-facebook-page.component.scss'
})
export class SelectFacebookPageComponent implements OnInit, OnDestroy {
  public facebookPageOptions: FacebookPageOptionType[] = [];
  public showSelectFacebookPagePopup: boolean = false;
  public showSuccessPopup: boolean = false;
  public facebookPageForm: FormGroup;
  private destroy$ = new Subject<boolean>();
  private faceBookPages: FacebookPageData[] = [];
  private payload: FacebookPayloadIntegrateType;
  private facebookUserInfo: FacebookUserInfoType;
  public isSubmitting: boolean = false;
  public textContentForSuccessPopup: string;
  public companyMailBoxId: string = null;

  get facebookPageControl() {
    return this.facebookPageForm?.get('facebookPage');
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly inboxFilterService: InboxFilterService,
    private readonly facebookService: FacebookService,
    public readonly facebookAccountService: FacebookAccountService,
    private readonly toastrService: ToastrService,
    private readonly inboxService: InboxService
  ) {
    this.facebookPageForm = this.fb.group({
      facebookPage: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.facebookAccountService.showSelectFacebookPage$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.openFrom === FacebookOpenFrom.integration)
      )
      .subscribe((isShowPopup) => {
        if (isShowPopup) this.showSelectFacebookPagePopup = true;
      });

    this.facebookAccountService.facebookPages$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.openFrom === FacebookOpenFrom.integration)
      )
      .subscribe((res) => {
        if (!res) return;
        this.faceBookPages = res.data;
        this.facebookUserInfo = res.userInfo;

        if (res.data?.length === 1) {
          this.facebookPageControl.setValue(res.data[0].id);
        }

        this.facebookPageOptions = res.data?.map((item) => {
          return {
            value: item.id,
            label: item.name
          };
        });
      });

    this.inboxService.listMailBoxs$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res)
      )
      .subscribe((listMailBoxs) => {
        this.companyMailBoxId = listMailBoxs.find(
          (item) =>
            item.status === EMailBoxStatus.ACTIVE &&
            item.type === EMailBoxType.COMPANY
        )?.id;
      });
  }

  closeSelectFacebookPagePopup() {
    this.facebookAccountService.logout();
    this.facebookAccountService.showSelectFacebookPage$.next({
      state: false,
      openFrom: FacebookOpenFrom.integration
    });
    this.showSelectFacebookPagePopup = false;
    this.isSubmitting = false;
    this.facebookPageControl.setValue(null);
    this.facebookPageControl.reset();
  }

  closeSuccessPopup() {
    this.showSuccessPopup = false;
    this.facebookPageControl.reset();
  }

  handleConfirm() {
    this.facebookPageControl.markAsTouched();
    if (this.facebookPageControl.invalid) return;
    this.isSubmitting = true;
    const pageSelected = this.faceBookPages?.find(
      (item) => item.id === this.facebookPageControl.value
    );
    this.payload = {
      pageId: pageSelected.id,
      name: pageSelected.name,
      avatar: pageSelected.picture?.data?.url,
      accessToken: this.facebookUserInfo.accessToken,
      userId: this.facebookUserInfo.userId
    };
    // Call api to save token facebook page
    this.facebookAccountService
      .integrateFacebookPageApi(this.payload)
      .subscribe({
        next: (res) => {
          if (res) {
            this.isSubmitting = false;
            this.closeSelectFacebookPagePopup();
            this.textContentForSuccessPopup = `The Messenger account for ${res.dataValues?.name} has been successfully
              added to your Trudi® inbox. Please note you'll only see messages received from this point onwards. You won't see any messages before integrating with Trudi®`;
            this.facebookService.setFacebookConnected(true);
            this.showSuccessPopup = true;
          }
        },
        error: (err) => {
          this.closeSelectFacebookPagePopup();
          if (err?.error?.message) this.toastrService.error(err.error.message);
        }
      });
  }

  navigateToInboxPage() {
    this.router.navigate(['/dashboard', 'inbox', ERouterLinkInbox.MESSENGER], {
      queryParams: {
        inboxType:
          this.inboxFilterService.getSelectedInboxType() || GroupType.TEAM_TASK,
        status: TaskStatusType.inprogress,
        mailBoxId: this.companyMailBoxId,
        channelId:
          this.facebookAccountService.currentPageMessengerActive$.value?.id
      }
    });
    this.closeSuccessPopup();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

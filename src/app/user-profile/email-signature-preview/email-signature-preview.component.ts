import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { CompanyService } from '@services/company.service';
import { EMailBoxStatus } from '@shared/enum';
import {
  CurrentUser,
  IImageSize,
  IMailBox
} from '@shared/types/user.interface';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';

@Component({
  selector: 'email-signature-preview',
  templateUrl: './email-signature-preview.component.html',
  styleUrls: ['./email-signature-preview.component.scss']
})
export class EmailSignaturePreviewComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() currentUserInfo: CurrentUser;
  @Input() imageSignature: string = '';
  @Input() imageSignatureSize: IImageSize;
  @Output() changeAgencySignature = new EventEmitter<string>();
  private destroy$ = new Subject<void>();
  mailboxSignature: string;
  agencySignature: string;
  listMailboxActive: Observable<IMailBox[]> = of([]);
  selectedMailBox: string;

  constructor(
    private mailboxSettingApiService: MailboxSettingApiService,
    private inboxService: InboxService,
    private companyService: CompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getListMailBox();
    this.getCurrentMailbox();
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    if ('currentUserInfo' in simpleChanges) {
      this.getMailBoxSetting(this.selectedMailBox);
    }
  }

  private getCurrentMailbox() {
    this.inboxService.currentMailBox$
      .pipe(distinctUntilChanged(), filter(Boolean), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.selectedMailBox = res.id;
        this.getMailBoxSetting(res.id);
      });
  }

  private getListMailBox() {
    this.listMailboxActive = this.companyService.getCurrentCompanyId().pipe(
      switchMap((companyId) => {
        return this.companyService.listCompanyAgent$.pipe(
          map((companyAgents) => {
            if (companyId && companyAgents?.length) {
              return companyAgents
                .find((it) => it?.companyId === companyId)
                ?.mailBoxes.filter(
                  (data) => data.status === EMailBoxStatus.ACTIVE
                );
            }
            return [];
          })
        );
      })
    );
  }

  private getMailBoxSetting(mailBoxId: string) {
    if (!mailBoxId) return;
    this.mailboxSettingApiService
      .getMailboxSetting(mailBoxId)
      .subscribe((res) => {
        if (!res) return;
        const { htmlStringSignature, agencyContent } = res || {};
        this.mailboxSignature = htmlStringSignature || '';
        this.agencySignature = agencyContent || '';
        !!agencyContent && this.changeAgencySignature.emit(agencyContent);
      });
  }

  public onChangeMailboxSelector(value: string) {
    if (!value) return;
    this.getMailBoxSetting(value);
  }

  public handleNavigate(url: string) {
    this.router.navigate([url]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

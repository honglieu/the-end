import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  EMailBoxPopUp,
  FieldFormIntegrateImap,
  ProtectionImapType
} from '@shared/enum/inbox.enum';
import { ImapForm, ProtectionIMAP } from '@shared/types/inbox.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { trimFormGroupValues } from '@shared/feature/function.feature';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'integrate-imap-smtp-server',
  templateUrl: './integrate-imap-smtp-server.component.html',
  styleUrls: ['./integrate-imap-smtp-server.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class IntegrateImapSmtpServerComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Input() visible: boolean = false;
  @Input() disableForm: boolean = false;
  @Input() isConnectAgain: boolean = false;
  @Output() onSave: EventEmitter<ImapForm> = new EventEmitter<ImapForm>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('avatar', { static: true }) canvasRef: ElementRef;
  private destroy$: Subject<void> = new Subject<void>();
  public readonly field = FieldFormIntegrateImap;
  public formImap: FormGroup;
  public listProtectionServer: ProtectionIMAP[] = [
    { label: 'None', value: ProtectionImapType.NONE },
    { label: 'SSL', value: ProtectionImapType.SSL },
    { label: 'TLS', value: ProtectionImapType.TLS }
  ];
  public agencyName: string = '';
  public userName: string = '';

  constructor(
    private _inboxService: InboxService,
    private _agencyService: AgencyService,
    private _userService: UserService,
    private _changeDetector: ChangeDetectorRef,
    private _dashboardApiService: DashboardApiService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.formImap = this._inboxService.buildFormIntegrateImapServer();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.agencyName = res.name;
      });
    this._userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.userName =
          res.firstName + (res.lastName ? ' ' + res.lastName : '');
      });
    this.getImapSetting();
  }

  ngAfterContentChecked(): void {
    this._changeDetector.markForCheck();
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleBack() {
    this._inboxService.setPopupMailBoxState(EMailBoxPopUp.EMAIL_PROVIDER);
  }

  public handleSave() {
    if (!this.disableForm) {
      trimFormGroupValues(this.formImap);
      if (this.formImap.invalid) {
        this.formImap.markAllAsTouched();
      } else {
        this.formImap.controls[this.field.PICTURE].setValue(
          this.isConnectAgain ? '' : this.generateAvatar()
        );
        this.onSave.emit(this.formImap.value);
      }
    }
  }

  private generateAvatar() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 300;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    context.fillStyle = '#00AA9F';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.borderRadius = '4';
    context.fillStyle = 'white';
    context.font = '130px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(
      this.get2CharacterFromName(),
      canvas.width / 2,
      canvas.height / 2
    );
    return canvas.toDataURL('image/png');
  }

  private get2CharacterFromName(): string {
    let name = this.formImap.controls[this.field.NAME].value.trim();
    if (name) {
      const words = name.split(' ');
      return (
        words.length == 1
          ? words[0].substring(0, 2)
          : words[0].charAt(0) + words[1].charAt(0)
      ).toUpperCase();
    } else {
      return '';
    }
  }

  get mailContactSupport(): string {
    const mailto: string = 'support@trudi.ai';
    const subject: string = 'Help setting up IMAP/SMPT email integration';
    const body: string = encodeURIComponent(
      `Hi Trudi support team\n\n` +
        `Please help! I'm having trouble setting up the IMAP/SMPT email integration. Could someone get in contact to help me out?\n\n` +
        `Thanks\n\n` +
        `${this.agencyName}\n` +
        `${this.userName}`
    );
    return `mailto:${mailto}?subject=${subject}&body=${body}`;
  }

  public getImapSetting() {
    if (this.isConnectAgain) {
      const id = localStorage.getItem('reconnectMailBoxId');
      this._dashboardApiService.getImapSetting(id).subscribe((res: any) => {
        if (res.id) {
          this.setValueForm(res.id, this.field.MAILBOX_ID);
          this.setValueForm(res.emailAddress, this.field.EMAIL);
          this.setValueForm(res.name, this.field.NAME);
          this.setValueForm(
            res.credential.imap.host,
            this.field.INBOX_SERVER,
            this.field.HOST
          );
          this.setValueForm(
            res.credential.imap.port,
            this.field.INBOX_SERVER,
            this.field.PORT
          );
          this.setValueForm(
            res.credential.imap.protection,
            this.field.INBOX_SERVER,
            this.field.PROTECTION
          );
          this.setValueForm(
            res.credential.smtp.host,
            this.field.OUTBOX_SERVER,
            this.field.HOST
          );
          this.setValueForm(
            res.credential.smtp.port,
            this.field.OUTBOX_SERVER,
            this.field.PORT
          );
          this.setValueForm(
            res.credential.imap.protection,
            this.field.OUTBOX_SERVER,
            this.field.PROTECTION
          );
        }
      });
    }
  }

  public setValueForm(
    value: string,
    controlName: string,
    subControlName?: string
  ) {
    let control: AbstractControl = subControlName
      ? (this.formImap.controls[controlName] as FormGroup).controls[
          subControlName
        ]
      : this.formImap.controls[controlName];
    control.setValue(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

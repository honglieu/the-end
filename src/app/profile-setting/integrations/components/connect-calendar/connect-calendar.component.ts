import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import { EmailProvider } from '@shared/enum/inbox.enum';

@Component({
  selector: 'connect-calendar',
  templateUrl: './connect-calendar.component.html',
  styleUrls: ['./connect-calendar.component.scss']
})
export class ConnectCalendarComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() onNext: EventEmitter<EmailProvider> =
    new EventEmitter<EmailProvider>();
  public active: EmailProvider;
  public isErrorSelect: boolean = false;
  public isOwner: boolean = false;
  public readonly emailProvider = EmailProvider;
  constructor(private integrationsService: IntegrationsService) {}

  ngOnInit(): void {}

  handleCancel() {
    this.integrationsService.setPopupIntegration(null);
    this.isErrorSelect = false;
    this.active = null;
  }

  onSelectCalendarProvider(
    provider: EmailProvider,
    triggerEvent: boolean = false
  ) {
    this.active = provider;
    if (!provider) {
      this.isErrorSelect = true;
    } else if (triggerEvent) {
      this.onNext.emit(provider);
      this.isErrorSelect = false;
      this.active = null;
    }
  }

  handleNext() {
    if (!this.active) {
      this.isErrorSelect = true;
    } else {
      this.onNext.emit(this.active);
      this.isErrorSelect = false;
      this.active = null;
    }
  }
}

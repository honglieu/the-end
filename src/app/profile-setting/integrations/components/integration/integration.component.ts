import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import {
  EIntegrationsLabel,
  INTEGRATION_COMPONENT,
  EIntegrationsStatus,
  IIntegrationItemsData,
  EIntegrationPopUp
} from '@/app/profile-setting/utils/integrations.interface';
import { CALENDAR_CONNECT_SUCCESSFULLY } from '@services/messages.constants';
import { RxWebsocketService } from '@services/rx-websocket.service';

import { EMailBoxPopUp } from '@shared/enum/inbox.enum';

@Component({
  selector: 'integration',
  templateUrl: './integration.component.html',
  styleUrls: ['./integration.component.scss']
})
export class IntegrationComponent implements OnInit, OnChanges {
  private destroy$ = new Subject<void>();
  @Input() item: IIntegrationItemsData = {} as IIntegrationItemsData;
  @Input() label: string;
  @Input() isShowConnected: boolean;
  @Output() onReConnect: EventEmitter<void> = new EventEmitter<void>();
  @Output() onDisconnect: EventEmitter<void> = new EventEmitter<void>();
  readonly EPoupState = EMailBoxPopUp;
  readonly EIntegationComponent = INTEGRATION_COMPONENT;

  public EIntegrationsStatus = EIntegrationsStatus;
  public EIntegrationLabel = EIntegrationsLabel;
  public socketStatus: EIntegrationsStatus = EIntegrationsStatus.UNSYNC;
  constructor(
    private integrationsService: IntegrationsService,
    private toastService: ToastrService,
    private websocketService: RxWebsocketService
  ) {}

  ngOnInit() {
    this.socketStatus = this.item?.data?.status;
    this.websocketService.onSocketSyncCalendar
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.label === EIntegrationsLabel.CALENDAR) {
          switch (res?.status) {
            case EIntegrationsStatus.SYNCING:
              this.socketStatus = EIntegrationsStatus.SYNCING;
              this.toastService.clear();
              this.toastService.show(
                'Events syncing',
                '',
                {
                  disableTimeOut: false
                },
                'toast-syncing-custom'
              );
              break;
            case EIntegrationsStatus.CONNECTED:
              this.toastService.clear();
              if (this.isShowConnected) {
                this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
              }
              this.toastService.success('Events synced');
              this.socketStatus = EIntegrationsStatus.CONNECTED;
              break;
            case EIntegrationsStatus.DISCONNECTED:
              this.toastService.clear();
              this.toastService.error('Events failed');
              this.socketStatus = EIntegrationsStatus.DISCONNECTED;
              break;
            case EIntegrationsStatus.FAILED:
              this.toastService.clear();
              this.toastService.error('Events failed');
              this.socketStatus = EIntegrationsStatus.FAILED;
              break;
            default:
              break;
          }
          this.integrationsService.setIntegrationsCalendarStatus(
            this.socketStatus
          );
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['item']?.currentValue) {
      this.socketStatus = this.item?.data?.status;
    }
  }

  handleClickConnect() {
    switch (this.label) {
      case EIntegrationsLabel.CALENDAR:
        this.isShowConnected = false;
        return this.integrationsService.setPopupState({
          showPopupSelectEvents: true
        });
      case EIntegrationsLabel.FORM:
        return this.integrationsService.setPopupState({
          showPopupIntegration: true
        });
      default:
        return this.integrationsService.setPopupState(null);
    }
  }

  checkBtnConnect() {
    return (
      !this.item?.status &&
      !this.item?.data &&
      this.label === EIntegrationsLabel.CALENDAR
    );
  }

  checkBtnReConnect() {
    return (
      this.item?.status &&
      this.label === EIntegrationsLabel.CALENDAR &&
      (this.item?.data?.status === EIntegrationsStatus.DISCONNECTED ||
        this.socketStatus === EIntegrationsStatus.DISCONNECTED)
    );
  }

  checkBtnDisconnect() {
    return (
      this.item?.status &&
      this.item?.data &&
      this.label === EIntegrationsLabel.CALENDAR
    );
  }

  checkDisabledBtn() {
    return (
      this.label === EIntegrationsLabel.CALENDAR &&
      this.socketStatus === EIntegrationsStatus.SYNCING
    );
  }

  checkTrudiBadge() {
    return (
      this.label === EIntegrationsLabel.FORM ||
      ((this.socketStatus === EIntegrationsStatus.SYNCING ||
        this.socketStatus === EIntegrationsStatus.FAILED ||
        this.socketStatus === EIntegrationsStatus.CONNECTED) &&
        this.label === EIntegrationsLabel.CALENDAR)
    );
  }

  handleConnect() {
    this.integrationsService.setPopupIntegration(
      EIntegrationPopUp.CONNECT_CALENDAR
    );
  }

  handleReConnect() {
    this.onReConnect.emit();
  }

  handleDisconnect() {
    this.onDisconnect.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

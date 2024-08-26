import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { pluck, tap } from 'rxjs';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { AgencyService } from '@services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { MaintenanceJobStatus } from '@shared/enum/maintenanceJobStatus.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';

@Component({
  selector: 'notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss']
})
export class NotificationPopupComponent implements OnInit {
  @Input() contents = [
    'Are you sure you want to complete maintenance request in Property Tree?'
  ];
  @Input() haveSentInvoice = false;
  @Input() isSendInvoiceFail = false;
  @Input() leftButtonText = 'Go back';
  @Input() leftButtonBackground: 'green' | 'gray' | 'red';
  @Input() rightButtonText = 'Confirm';
  @Input() rightButtonBackground: 'green' | 'gray' | 'red';
  @Output() onClose = new EventEmitter<boolean>();

  public notShowAgain: FormGroup;
  constructor(
    private conversationService: ConversationService,
    private agencyService: AgencyService,
    public taskService: TaskService,
    private controlPanelService: ControlPanelService,
    private widgetPTService: WidgetPTService
  ) {}

  ngOnInit(): void {
    this.notShowAgain = new FormGroup({
      status: new FormControl(false)
    });
  }

  get notShowAgainStatus() {
    return this.notShowAgain.get('status');
  }

  getCheckboxDisplay() {
    return this.notShowAgainStatus.value
      ? '/assets/icon/checkbox-on.svg'
      : '/assets/icon/checkbox-off.svg';
  }

  close() {
    this.onClose.emit(true);
  }

  submit() {
    const { id, agencyId } = this.taskService.currentTask$?.value || {};
    this.conversationService
      .changeMaintenanceJobPT(
        id,
        this.haveSentInvoice
          ? MaintenanceJobStatus.COMPLETE
          : MaintenanceJobStatus.CANCEL,
        agencyId
      )
      .pipe(
        pluck('data'),
        tap((el) =>
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.MAINTENANCE_REQUEST,
            'UPDATE',
            [el]
          )
        )
      )
      .subscribe(
        (next) => {
          this.onClose.emit(true);
        },
        (error) => {
          this.onClose.emit(true);
        }
      );
  }

  ngOnDestroy() {
    this.conversationService.sendStatusSync.next(null);
  }
}

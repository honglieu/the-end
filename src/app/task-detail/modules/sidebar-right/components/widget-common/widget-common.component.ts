import { EButtonType, EButtonWidget } from '@trudi-ui';
import {
  Component,
  OnInit,
  OnChanges,
  Output,
  EventEmitter,
  Input,
  SimpleChanges
} from '@angular/core';
import { SharedService } from '@services/shared.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
interface IWidget {
  isShowBackground: boolean;
  isShowSuccess: boolean;
}
@Component({
  selector: 'widget-common',
  templateUrl: './widget-common.component.html',
  styleUrls: ['./widget-common.component.scss']
})
export class WidgetCommonComponent implements OnInit, OnChanges {
  @Input() title = '';
  @Input() buttonKey: string;
  @Input() isDislayBtnCancel: boolean = false;
  private bgrCompleted: NodeJS.Timeout = null;
  @Input() hideStatusSection: boolean = false;
  @Input() type: ESyncStatus;
  @Input() get firstTimeSyncSuccess(): boolean {
    return this.widgetState.isShowSuccess;
  }
  @Input() isShowActionWhenInvoiceStatusUnPaid: boolean = false;

  set firstTimeSyncSuccess(isShowSuccess: boolean) {
    this.widgetState = {
      isShowSuccess: this.type == ESyncStatus.FAILED ? false : isShowSuccess,
      isShowBackground: true
    };
  }

  @Input() errorTitle: string = null;
  @Input() successTitle: string = null;
  @Output() retry: EventEmitter<void> = new EventEmitter<void>();
  @Output() remove: EventEmitter<void> = new EventEmitter<void>();
  @Output() showModal: EventEmitter<void> = new EventEmitter<void>();
  isConsole: boolean;

  public syncPropertyTree = ESyncStatus;
  public widgetState: IWidget = {
    isShowBackground: true,
    isShowSuccess: false
  };
  readonly EButtonType = EButtonType;
  readonly EButtonWidget = EButtonWidget;
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!this.widgetState.isShowSuccess) {
      if (!!this.bgrCompleted) {
        clearTimeout(this.bgrCompleted);
      }
      this.bgrCompleted = setTimeout(() => {
        this.widgetState.isShowBackground = false;
      }, 3000);
    }
  }
  handleRetry(e: MouseEvent) {
    e.stopPropagation();
    this.retry.emit();
  }

  handleRemove(e: MouseEvent) {
    e.stopPropagation();
    this.remove.emit();
  }

  handleClickCard(e: MouseEvent) {
    e.stopPropagation();
    this.showModal.emit();
  }

  ngOnDestroy(): void {
    clearTimeout(this.bgrCompleted);
  }
}

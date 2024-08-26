import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  ViewContainerRef,
  forwardRef,
  TemplateRef
} from '@angular/core';
import { TrudiConfirmService } from './service/trudi-confirm.service';

@Component({
  selector: 'trudi-confirm',
  templateUrl: './trudi-confirm.component.html',
  styleUrls: ['./trudi-confirm.component.scss']
})
export class TrudiConfirmComponent implements OnInit {
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() canceled = new EventEmitter<void>();

  public configs: ITrudiConfirmConfigs;

  constructor(private trudiConfirmService: TrudiConfirmService) {}

  ngOnInit(): void {
    this.configs = this.trudiConfirmService.getConfigs();
  }

  confirm(event) {
    const isChecked = this.configs.allowCheckbox && event?.isChecked;
    this.confirmed.emit(!!isChecked);
  }

  cancel() {
    this.canceled.emit();
  }
}

export interface ITrudiConfirmConfigs {
  title: string;
  okText?: string;
  cancelText?: string;
  subtitle?: string;
  content?: TemplateRef<HTMLElement>;
  colorBtn?: string;
  iconName?: string;
  closable?: boolean;
  className?: string;
  modelWidth?: number;
  checkboxLabel?: string;
  allowCheckbox?: boolean;
  hiddenCancelBtn?: boolean;
  dataE2E?: string;
}

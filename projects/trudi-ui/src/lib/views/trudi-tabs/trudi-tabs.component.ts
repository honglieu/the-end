import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { TrudiTab } from './trudi-tabs.interface';

@Component({
  selector: 'trudi-tabs',
  templateUrl: './trudi-tabs.component.html',
  styleUrls: ['./trudi-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiTabsComponent {
  constructor() {}

  @Input() tabs: TrudiTab<unknown>[] = [];
  @Input() type: TabType = 'line';
  @Input() queryParamsHandling = 'merge';
  @Output() changePopupState = new EventEmitter<{}>();
  @Output() changeTab = new EventEmitter<void>();
  isOwnerOrAdmin: boolean = false;
  popupState: { [key: string]: boolean } = {};

  handlePopupState(state: { [key: string]: boolean }) {
    this.popupState = { ...this.popupState, ...state };
    this.changePopupState.emit(this.popupState);
  }

  handleClick() {
    this.changeTab.emit();
  }
}
type TabType = 'card' | 'line';

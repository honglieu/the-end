import {
  Component,
  Output,
  TemplateRef,
  ViewChild,
  EventEmitter
} from '@angular/core';
import { DropdownPanel } from './dropdown-panel';

@Component({
  selector: 'dropdown-menu',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownMenuComponent implements DropdownPanel {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Output() closed = new EventEmitter<void>();

  constructor() {}
}

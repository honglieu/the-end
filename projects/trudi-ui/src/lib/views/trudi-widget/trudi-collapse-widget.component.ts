import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'trudi-collapse-widget',
  templateUrl: './trudi-collapse-widget.component.html',
  styleUrls: ['./trudi-collapse-widget.component.scss']
})
export class TrudiCollapseWidgetComponent implements OnInit {
  @Input() activeExpand: boolean = false;
  @Input() titleHeader: TemplateRef<void>;
  @Input() titleHeaderRight: TemplateRef<void>;
  @Input() createNewIcon: boolean = false;
  @Input() disabled = false;
  @Input() itemsCount = 0;
  @Input() isShowItemsCount = false;
  @Input() showArrow = true;
  @Input() expandText: {
    open: string;
    close: string;
  };
  @Input() buttonKey: string;
  @Input() buttonType: string;
  @Output() createNewItem: EventEmitter<void> = new EventEmitter<void>();
  @Output() activeChange: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  handleActiveChange(e) {
    this.activeChange.emit(e);
  }

  handleCreateNew(e: MouseEvent) {
    e.stopPropagation();
    this.createNewItem.emit();
  }
}

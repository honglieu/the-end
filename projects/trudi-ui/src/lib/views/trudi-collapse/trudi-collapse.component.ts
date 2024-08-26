import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'trudi-collapse',
  templateUrl: './trudi-collapse.component.html',
  styleUrls: ['./trudi-collapse.component.scss']
})
export class TrudiCollapseComponent implements OnInit {
  @Input() activeExpand: boolean = false;
  @Input() titleHeader: TemplateRef<void>;
  @Input() createNewIcon: boolean = false;
  @Output() activeChange: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  handleActiveChange(e) {
    this.activeChange.emit(e);
  }
}

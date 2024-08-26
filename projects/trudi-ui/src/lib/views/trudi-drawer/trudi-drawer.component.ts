import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'trudi-drawer',
  templateUrl: './trudi-drawer.component.html',
  styleUrls: ['./trudi-drawer.component.scss']
})
export class TrudiDrawerComponent implements OnInit, AfterViewInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() okText: string = 'Save';
  @Input() enableOkBtn: boolean = true;
  @Input() width: number = 624;
  @Input() enableBackBtn: boolean = false;
  @Input() enableDeleteBtn: boolean = false;
  @Input() enableCancel: boolean = true;
  @Input() headerTpl?: string | TemplateRef<{}>;
  @Input() footerTpl?: string | TemplateRef<{}>;
  @Input() hiddenFooter: boolean = false;
  @Input() disabledNext: boolean = false;
  @Input() disabledDelete: boolean = false;
  @Input() disabledCancel: boolean = false;
  @Input() wrapClassName: string = '';
  @Input() nzClosable: boolean = false;

  @Output() readonly onOk = new EventEmitter<void>();
  @Output() readonly onBack = new EventEmitter<void>();
  @Output() readonly onCancel = new EventEmitter<void>();
  @Output() readonly onDelete = new EventEmitter<void>();
  @Output() readonly onClose = new EventEmitter<void>();
  @Output() readonly onScroll: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const drawerBodyElement = document.querySelector('.ant-drawer-body');
    drawerBodyElement.addEventListener(
      'scroll',
      this.onScrollDrawerContent.bind(this)
    );
  }

  onScrollDrawerContent(event: Event) {
    const element = event?.target as HTMLElement;
    this.onScroll.emit(true);
  }

  handleOk() {
    this.onOk.emit();
  }

  handleBack() {
    this.onBack.emit();
  }

  handleCancel() {
    this.onCancel.emit();
  }

  handleDelete() {
    this.onDelete.emit();
  }

  handleClose() {
    this.onClose.emit();
  }
}

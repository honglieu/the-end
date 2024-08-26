import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ContentChild,
  SimpleChanges,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NzModalComponent } from 'ng-zorro-antd/modal';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, debounceTime, filter, takeUntil } from 'rxjs';
import { IDataE2ETrudiModal } from '../../common/types/data-e2e-trudi-modal';
import { TrudiButtonType } from '../trudi-button';

@Component({
  selector: 'trudi-modal',
  templateUrl: './trudi-modal.component.html',
  styleUrls: ['./trudi-modal.component.scss']
})
export class TrudiModalComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  @ContentChild('headerModal', { static: false })
  headerCustomTemplate: TemplateRef<any>;
  @ContentChild('footerModal', { static: false })
  footerCustomTemplate: TemplateRef<any>;
  @ViewChild('trudiModal')
  trudiModal: NzModalComponent;

  // add two way binding for visible property
  @Input() visible!: boolean;
  @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() closable: boolean = true;
  @Input() expandable: boolean = false;
  @Input() isHideBody: boolean = false;
  @Input() isHideFooter: boolean = false;
  @Input() isHideHeader = false;
  @Input() modelWidth?: number;
  @Input() type: ModalType = 'default';
  @Input() allowCheckbox: boolean = false;
  @Input() colorBtn: TrudiButtonType = 'primary';
  @Input() className: string = '';
  @Input() classContainer: string = '';
  @Input() okText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() title: string = 'title';
  @Input() subTitle: string;
  @Input() checkboxLabel: string = 'checkbox';
  @Input() iconName: string = '';
  @Input() autoFocus: string = 'auto';
  @Input() maskClosable: boolean = false;
  @Input() hiddenCancelBtn: boolean = false;
  @Input() hiddenOkBtn: boolean = false;
  @Input() showBackBtn: boolean = false;
  @Input() noAnimation: boolean = false;
  @Input() disableOkBtn: boolean = false;
  @Input() subTitleTemplate?: NgTemplateOutlet;
  @Input() isCustomPopup: boolean = false;
  @Input() isCondense: boolean = false;
  @Input() dataE2E: IDataE2ETrudiModal;
  @Input() showIconName: boolean = true;

  @Output() onOk: EventEmitter<TEvent> = new EventEmitter<TEvent>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() triggerAfterClose: EventEmitter<void> = new EventEmitter<void>();
  public nzClassName: string;
  public nzWidth: number | string;
  public containerClasses: string;

  isChecked: boolean = false;
  isFullScreenModal: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.handleModalType();
    this.subscribeRouteEvents();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['type']?.currentValue || changes['className']?.currentValue) {
      this.handleModalType();
    }

    if (changes['classContainer'] || changes['isCondense']) {
      this.containerClasses = `${this.classContainer} ${
        this.isCondense ? 'condense' : ''
      }`;
    }
  }

  handleModalType() {
    const confirmType = this.type === 'confirm';
    this.nzClassName = `trudi-modal
        ${this.className ?? ''}
        ${this.allowCheckbox ? 'has-checkbox' : ''}
        ${confirmType ? 'trudi-modal-confirm' : ''}`;

    this.nzWidth = this.modelWidth ? this.modelWidth : confirmType ? 510 : 624;

    if (this.isFullScreenModal) {
      this.nzClassName += ' trudi-modal-fullscreen';
      this.nzWidth = '100%';
    }
  }

  handleOk(): void {
    const event = this.allowCheckbox ? { isChecked: this.isChecked } : null;
    this.onOk.emit(event);
  }

  handleCancel(): void {
    this.visible = false;
    // schedule to emit event after nz-modal is closed completely
    setTimeout(() => {
      this.onCancel.emit();
      this.visibleChange.emit(this.visible);
    }, 100);
  }

  handleBack(): void {
    this.onBack.emit();
  }

  triggerExpandOrResizeModal(value: boolean) {
    this.isFullScreenModal = value;
    this.handleModalType();
  }

  handleAfterClose() {
    // schedule to emit event after nz-modal is closed completely
    setTimeout(() => {
      this.triggerAfterClose.emit();
    }, 0);
  }

  subscribeRouteEvents() {
    const checkChangeUrl = (event) => {
      return event.urlAfterRedirects.startsWith(
        event.url.substring(
          0,
          event.url.indexOf('?') > -1
            ? event.url.indexOf('?')
            : event.url.length
        )
      );
    };
    this.router.events
      .pipe(
        takeUntil(this.destroyed$),
        filter(
          (event) =>
            this.visible &&
            event instanceof NavigationEnd &&
            !checkChangeUrl(event)
        ),
        debounceTime(100)
      )
      .subscribe((event) => {
        this.trudiModal.close();
        this.handleCancel();
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

type TEvent<T = {}> = T;
type ModalType = 'default' | 'confirm';

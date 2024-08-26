import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { PreventButtonService } from './prevent-button.service';
import { EButtonType, ButtonKey } from './prevent-button.contstant';
import { Subject } from 'rxjs';

// shouldn't use this with cases of multiple elements like list-button
// instead, use shouldHandleProcess in PreventButtonService as illustrated below: example notification-component
@Directive({
  selector: '[PreventButton]'
})
export class PreventButtonDirective implements OnInit, OnDestroy {
  @Input() clearProcessOnDestroy: boolean = true;
  @Output() leftClick = new EventEmitter<MouseEvent>();

  private destroy$ = new Subject<void>();
  private buttonKey: ButtonKey = null;
  private buttonType: EButtonType = null;

  constructor(
    private el: ElementRef,
    private PreventButtonService: PreventButtonService
  ) {}

  @HostListener('click', ['$event'])
  handleClick(event: MouseEvent) {
    this.PreventButtonService.handleClick(
      this.buttonKey,
      this.buttonType,
      event,
      (e, payload) => {
        if (payload?.stopHandle) return;
        this.leftClick.emit(e);
      }
    );
  }

  ngOnInit(): void {
    this.initProcessValue();
  }

  initProcessValue() {
    const element = this.el.nativeElement as HTMLDivElement;
    this.buttonKey = element.dataset['buttonKey'] as ButtonKey;
    this.buttonType = element.dataset['buttonType'] as EButtonType;
  }

  ngOnDestroy(): void {
    this.clearProcessOnDestroy && this.PreventButtonService.deleteProcess(this.buttonKey, this.buttonType);
    this.destroy$.next();
    this.destroy$.complete();
  }
}

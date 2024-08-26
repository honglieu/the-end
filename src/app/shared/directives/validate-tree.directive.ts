import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { Subject, takeUntil } from 'rxjs';
import { PreventButtonService } from '@trudi-ui';
import { EButtonType, ButtonKey } from '@trudi-ui';

@Directive({
  selector: '[click-validation]'
})
export class ValidateTreeDirective implements OnInit, OnDestroy {
  @Output('click-validation') clickValidation: EventEmitter<MouseEvent> =
    new EventEmitter<MouseEvent>();
  private unsubscribe: Subject<void> = new Subject<void>();

  private isTreeChanged: boolean = false;
  private buttonKey: ButtonKey = null;
  private buttonType: EButtonType = null;
  private stopHandle: boolean = false;

  constructor(
    private el: ElementRef,
    private templateTreeService: TemplateTreeService,
    @Inject(PreventButtonService)
    private PreventButtonService: PreventButtonService
  ) {}

  @HostListener('click', ['$event'])
  @HostListener('keydown.enter', ['$event'])
  @HostListener('touchend', ['$event'])
  onClick(event: MouseEvent) {
    this.PreventButtonService.handleClick(
      this.buttonKey,
      this.buttonType,
      event,
      (e, payload) => {
        if (payload?.stopHandle) {
          this.stopHandle = true;
        }
      }
    );

    if (this.stopHandle) {
      this.stopHandle = false;
      return;
    }

    if (this.isTreeChanged) {
      this.templateTreeService.setSaveChangeError({
        isError: true
      });
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.clickValidation.emit(event);
    }
  }

  initProcessValue() {
    const element = this.el.nativeElement as HTMLDivElement;
    this.buttonKey = element.dataset['buttonKey'] as ButtonKey;
    this.buttonType = element.dataset['buttonType'] as EButtonType;
  }

  ngOnInit() {
    this.initProcessValue();
    this.templateTreeService
      .isTreeChanged()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isTreeChanged = res;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

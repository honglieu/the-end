import { ResizableModalPopupComponent } from '@shared/components/resizable-modal/resizable-modal-popup';
import { Directive, Input, OnDestroy } from '@angular/core';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { NzDropDownDirective } from 'ng-zorro-antd/dropdown';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[close-dropdown-when-resizable]',
  exportAs: 'closeDropdownWhenResizable'
})
export class CloseDropdownWhenResizableDirective implements OnDestroy {
  private destroyed$ = new Subject<void>();
  @Input() nzPopoverComponent?: NzPopoverDirective;
  @Input() nzDropDownDirective?: NzDropDownDirective;

  constructor() {
    ResizableModalPopupComponent.onResizeOrDragStarted
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.nzPopoverComponent?.visibleChange?.emit(false);
        this.nzDropDownDirective?.nzVisibleChange?.emit(false);
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

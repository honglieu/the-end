import { Directive, OnDestroy, OnInit, Inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Directive({
  selector: '[dragCursor]'
})
export class DragCursorDirective implements OnInit, OnDestroy {
  private unsubscribe$: Subject<void> = new Subject();
  constructor(
    private cdkDrag: CdkDrag,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public ngOnInit(): void {
    this.cdkDrag.started.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.document.body.classList.add('inherit_cursors--drag--message');
      this.document.body.style.cursor = 'grabbing';
    });

    this.cdkDrag.ended.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.document.body.classList.remove('inherit_cursors--drag--message');
      this.document.body.style.cursor = 'unset';
    });
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

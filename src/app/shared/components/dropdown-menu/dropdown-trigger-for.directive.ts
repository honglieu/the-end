import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewContainerRef
} from '@angular/core';
import { DropdownPanel } from './dropdown-panel';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, Subscription } from 'rxjs';
import { POSITION_MAP } from '@services/constants';

@Directive({
  selector: '[dropdownTriggerFor]',
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(click)': 'toggleDropdown()'
  }
})
export class DropdownTriggerForDirective implements OnDestroy, OnChanges {
  private isDropdownOpen = false;
  private overlayRef: OverlayRef;
  private dropdownClosingActionsSub = Subscription.EMPTY;
  @Input() position = [POSITION_MAP.bottomRight];
  @Input('dropdownTriggerFor') public dropdownPanel: DropdownPanel;
  @Input() disabledTrigger = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef
  ) {}

  toggleDropdown(): void {
    this.isDropdownOpen ? this.destroyDropdown() : this.openDropdown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabledTrigger']?.currentValue) {
      this.destroyDropdown();
    }
  }

  openDropdown(): void {
    if (this.disabledTrigger) return;
    this.isDropdownOpen = true;
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.close(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions([...this.position])
    });

    const elementRefWidth = this.elementRef.nativeElement.offsetWidth;

    this.overlayRef?.addPanelClass('position-dropdown-menu');

    this.overlayRef?.updateSize({
      width: elementRefWidth
    });

    const templatePortal = new TemplatePortal(
      this.dropdownPanel?.templateRef,
      this.viewContainerRef
    );
    this.overlayRef.attach(templatePortal);

    this.dropdownClosingActionsSub = this.dropdownClosingActions().subscribe(
      () => this.destroyDropdown()
    );
    this.visibleChange.emit(true);
  }

  private dropdownClosingActions(): Observable<MouseEvent | void> {
    const backdropClick$ = this.overlayRef.backdropClick();
    const detachment$ = this.overlayRef.detachments();
    const dropdownClosed = this.dropdownPanel.closed;
    return merge(backdropClick$, detachment$, dropdownClosed);
  }

  private destroyDropdown(): void {
    if (!this.overlayRef || !this.isDropdownOpen) {
      return;
    }
    this.dropdownClosingActionsSub.unsubscribe();
    this.isDropdownOpen = false;
    this.overlayRef.detach();
    this.visibleChange.emit(false);
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }
}

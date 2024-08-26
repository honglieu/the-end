import {
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';

@Directive({
  selector: 'ng-template[toolbarItemTemplate]'
})
export class ToolbarItemTemplateDirective implements OnDestroy {
  @Input() visibleViewContainer: boolean = true;
  @Output() readonly visibleChange = new EventEmitter<boolean>();
  private _visible = false;

  public setVisibleChange(visible: boolean) {
    if (visible !== this._visible) {
      this._visible = visible;
      this.visibleChange.emit(visible);
    }
  }

  public ngOnDestroy(): void {
    this.visibleChange.complete();
  }
}

@Directive({
  selector: 'ng-template[toolbarCollapseButtonTemplate]'
})
export class ToolbarCollapseButtonTemplateDirective {}

@Directive({
  selector: '[toolbarItem]'
})
export class ToolbarItemDirective {}

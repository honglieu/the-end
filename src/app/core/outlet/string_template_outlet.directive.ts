import {
  Directive,
  EmbeddedViewRef,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

import { TrudiSafeAny } from '@core';

@Directive({
  selector: '[trudiStringTemplateOutlet]',
  exportAs: 'trudiStringTemplateOutlet'
})
export class TrudiStringTemplateOutletDirective<_T = unknown>
  implements OnChanges
{
  private embeddedViewRef: EmbeddedViewRef<TrudiSafeAny> | null = null;
  private context = new TrudiStringTemplateOutletContext();
  @Input() trudiStringTemplateOutletContext: TrudiSafeAny | null = null;
  @Input() trudiStringTemplateOutlet: TrudiSafeAny | TemplateRef<TrudiSafeAny> =
    null;

  static ngTemplateContextGuard<T>(
    _dir: TrudiStringTemplateOutletDirective<T>,
    _ctx: TrudiSafeAny
  ): _ctx is TrudiStringTemplateOutletContext {
    return true;
  }

  private recreateView(): void {
    this.viewContainer.clear();
    const isTemplateRef = this.trudiStringTemplateOutlet instanceof TemplateRef;
    const templateRef = (
      isTemplateRef ? this.trudiStringTemplateOutlet : this.templateRef
    ) as TrudiSafeAny;
    this.embeddedViewRef = this.viewContainer.createEmbeddedView(
      templateRef,
      isTemplateRef ? this.trudiStringTemplateOutletContext : this.context
    );
  }

  private updateContext(): void {
    const isTemplateRef = this.trudiStringTemplateOutlet instanceof TemplateRef;
    const newCtx = isTemplateRef
      ? this.trudiStringTemplateOutletContext
      : this.context;
    const oldCtx = this.embeddedViewRef!.context as TrudiSafeAny;
    if (newCtx) {
      for (const propName of Object.keys(newCtx)) {
        oldCtx[propName] = newCtx[propName];
      }
    }
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<TrudiSafeAny>
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { trudiStringTemplateOutletContext, trudiStringTemplateOutlet } =
      changes;
    const shouldRecreateView = (): boolean => {
      let shouldOutletRecreate = false;
      if (trudiStringTemplateOutlet) {
        if (trudiStringTemplateOutlet.firstChange) {
          shouldOutletRecreate = true;
        } else {
          const isPreviousOutletTemplate =
            trudiStringTemplateOutlet.previousValue instanceof TemplateRef;
          const isCurrentOutletTemplate =
            trudiStringTemplateOutlet?.currentValue instanceof TemplateRef;
          shouldOutletRecreate =
            isPreviousOutletTemplate || isCurrentOutletTemplate;
        }
      }
      const hasContextShapeChanged = (ctxChange: SimpleChange): boolean => {
        const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
        const currCtxKeys = Object.keys(ctxChange?.currentValue || {});
        if (prevCtxKeys.length === currCtxKeys.length) {
          for (const propName of currCtxKeys) {
            if (prevCtxKeys.indexOf(propName) === -1) {
              return true;
            }
          }
          return false;
        } else {
          return true;
        }
      };
      const shouldContextRecreate =
        trudiStringTemplateOutletContext &&
        hasContextShapeChanged(trudiStringTemplateOutletContext);
      return shouldContextRecreate || shouldOutletRecreate;
    };

    if (trudiStringTemplateOutlet) {
      this.context.$implicit = trudiStringTemplateOutlet?.currentValue;
    }

    const recreateView = shouldRecreateView();
    if (recreateView) {
      /** recreate view when context shape or outlet change **/
      this.recreateView();
    } else {
      /** update context **/
      this.updateContext();
    }
  }
}

export class TrudiStringTemplateOutletContext {
  public $implicit: TrudiSafeAny;
}

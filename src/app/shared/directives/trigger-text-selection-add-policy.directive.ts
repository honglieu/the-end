import { IPolicyDetail } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { PropertiesService } from '@services/properties.service';
import { PolicyDetailPanelComponent } from '@/app/share-pop-up/policy-detail/policy-detail-panel/policy-detail-panel.component';
import {
  IAddPolicyPopoverStyle,
  SelectPolicyTypePopupComponent
} from '@/app/share-pop-up/select-policy-type-pop-up/select-policy-type-pop-up.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  Input,
  OnDestroy,
  AfterContentInit,
  NgZone
} from '@angular/core';
import { Subject, filter, map, switchMap, takeUntil } from 'rxjs';
import { getPolicyPopoverStyle } from '@shared/feature/function.feature';
import { EPolicyDetailOpenFrom } from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import { ActivatedRoute } from '@angular/router';
import { TaskStatusType } from '@/app/shared/enum';

@Directive({
  selector: '[triggerTextSelectionAddPolicy]'
})
export class TriggerTextSelectionAddPolicyDirective
  implements OnDestroy, AfterContentInit
{
  @Input() triggerTextSelectionAddPolicy: boolean = true;
  private selectedText: string = '';
  private iframeDocument: Document | null = null;
  private overlayRef: OverlayRef;
  private currentPropertyId: string;
  private timeOut: NodeJS.Timeout = null;
  private destroy$ = new Subject<void>();
  private outputDestroy$ = new Subject<void>();

  private scrollEventListener: () => void;
  private mousedownEventListener: () => void;
  private iframeMouseupListener: () => void;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private overlay: Overlay,
    private propertyService: PropertiesService,
    private route: ActivatedRoute,
    private readonly zone: NgZone
  ) {
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        switchMap((queryParams) =>
          this.propertyService.newCurrentProperty.pipe(
            takeUntil(this.destroy$),
            filter(Boolean),
            map((property) => ({ queryParams, property }))
          )
        )
      )
      .subscribe(({ queryParams, property }) => {
        const { isTemporary, id } = property;
        const isEmailFolder =
          queryParams['status'] === TaskStatusType.mailfolder;

        this.currentPropertyId = isTemporary || isEmailFolder ? '' : id;
      });
  }

  ngAfterContentInit(): void {
    if (!this.triggerTextSelectionAddPolicy) return;
    this.listenIframeEvent();
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (
      !this.triggerTextSelectionAddPolicy ||
      this.iframeDocument ||
      this.checkIfClickFromPolicyContent(event.target as Node)
    )
      return;
    this.onEventMouseUp(event);
  }

  onEventMouseUp(event: MouseEvent) {
    const selectedText = this.getSelectedText();
    if (!selectedText) return;
    this.selectedText = selectedText;
  }

  private setIframeStyle() {
    const styleContent = `
      *::selection {
        background: rgba(153, 153, 153, 0.4) !important;
        color: #333741 !important;
      }
    `;

    const styleElement = this.iframeDocument.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = styleContent;

    this.iframeDocument.head.appendChild(styleElement);
  }

  private checkIfClickFromPolicyContent(target: Node) {
    const policyContent = document.getElementById(
      'select-policy-dropdown-menu'
    );
    return policyContent?.contains(target);
  }

  private listenIframeEvent() {
    const element = this.el.nativeElement;
    const isIFame = element.tagName === 'IFRAME';
    if (!isIFame || !this.triggerTextSelectionAddPolicy) return;
    this.zone.runOutsideAngular(() => {
      element.addEventListener('load', () => {
        this.iframeDocument =
          element.contentDocument || element.contentWindow?.document;

        if (this.iframeDocument) {
          this.timeOut = setTimeout(() => {
            this.clearListener(this.iframeMouseupListener);
            this.iframeMouseupListener = this.renderer.listen(
              this.iframeDocument,
              'mouseup',
              (event: MouseEvent) => {
                this.onEventMouseUp(event);
              }
            );
            this.setIframeStyle();
          }, 0);
        }
      });
    });
  }

  listenContainerEvent(): void {
    this.zone.runOutsideAngular(() => {
      this.clearListener(this.mousedownEventListener);
      this.clearListener(this.scrollEventListener);

      this.mousedownEventListener = this.renderer.listen(
        this.iframeDocument || 'window',
        'mousedown',
        () => this.unselectText()
      );

      const closestScrollContainerWrapper = this.el.nativeElement.closest(
        '.scroll-container-wrapper'
      );

      if (closestScrollContainerWrapper) {
        this.scrollEventListener = this.renderer.listen(
          closestScrollContainerWrapper,
          'scroll',
          () => {
            this.destroyOverlayRef();
            this.selectedText = '';
          }
        );
      }
    });
  }

  private getSelectedText(): string | null {
    const selection = this.iframeDocument
      ? this.iframeDocument.getSelection()
      : window.getSelection();

    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const isRangeInside = this.iframeDocument
      ? this.iframeDocument.body.contains(container)
      : this.el.nativeElement.contains(container);
    const selectedText = selection.toString().trim();

    if (!isRangeInside || !selectedText?.length) return null;
    const iframeRect = this.iframeDocument
      ? this.el.nativeElement.getBoundingClientRect()
      : null;

    const wrapperReact = this.el.nativeElement
      .closest('.scroll-container-wrapper')
      ?.getBoundingClientRect();

    const rangeRect = range.getBoundingClientRect();
    const style = getPolicyPopoverStyle(rangeRect, iframeRect, wrapperReact);

    !this.selectedText &&
      this.createSelectPolicyTypeComponent(selectedText, style);
    return selectedText;
  }

  unselectText() {
    this.selectedText = '';
    window.getSelection().removeAllRanges();
    this.iframeDocument && this.iframeDocument.getSelection().removeAllRanges();
  }

  createSelectPolicyTypeComponent(
    selectedText: string,
    style: {
      button: IAddPolicyPopoverStyle;
      popup: IAddPolicyPopoverStyle;
    }
  ) {
    this.destroyOverlayRef();
    this.listenContainerEvent();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(SelectPolicyTypePopupComponent);
    const componentRef = this.overlayRef.attach(componentPortal);
    componentRef.instance.styles = style;
    componentRef.instance.visible = true;
    componentRef.instance.propertyIds = [this.currentPropertyId];
    componentRef.instance.selectedText = selectedText
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
    componentRef.instance.triggerNextBtn
      .pipe(takeUntil(this.outputDestroy$))
      .subscribe((policyData) => {
        this.createPolicyDetailPanel(selectedText, policyData || null);
        this.selectedText = '';
      });

    componentRef.instance.visibleChange
      .pipe(takeUntil(this.outputDestroy$))
      .subscribe((visible) => {
        !visible && this.destroyOverlayRef();
        this.selectedText = '';
      });
  }

  createPolicyDetailPanel(selectedText: string, policyData: IPolicyDetail) {
    this.destroyOverlayRef();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(PolicyDetailPanelComponent);
    const componentRef = this.overlayRef.attach(componentPortal);
    componentRef.instance.visible = true;
    componentRef.instance.editMode = true;
    componentRef.instance.manualHighlighText = selectedText
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
    componentRef.instance.policyDefaultValue = policyData;
    componentRef.instance.openFrom = EPolicyDetailOpenFrom.MESSAGE_MODAL;
    componentRef.instance.ngOnChanges({
      policyDefaultValue: {
        currentValue: policyData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    componentRef.instance.closeDrawer
      .pipe(takeUntil(this.outputDestroy$))
      .subscribe(() => {
        this.destroyOverlayRef();
      });
  }

  removeAllOutputAndEventListen() {
    this.outputDestroy$.next();
    this.outputDestroy$.complete();
    this.clearListener(this.scrollEventListener);
    this.clearListener(this.mousedownEventListener);
  }

  private destroyOverlayRef(): void {
    if (!this.overlayRef) return;
    this.overlayRef.dispose();
    this.removeAllOutputAndEventListen();
  }

  clearListener(listener: () => void) {
    listener && listener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyOverlayRef();
    this.removeAllOutputAndEventListen();
    this.clearListener(this.iframeMouseupListener);
    clearTimeout(this.timeOut);
  }
}

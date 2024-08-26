import { AiInteractiveBubbleComponent } from '@/app/dashboard/components/ai-interactive-bubble/ai-interactive-bubble.component';
import {
  AiInteractiveBubbleInitialData,
  EAiWindowState,
  EFocusState
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { AIDetectPolicyService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-detect-policy.service';
import { AIInteractiveInitialDataToken } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { TinyEditorComponent } from '@shared/components/tiny-editor/tiny-editor.component';
import { TrudiAIMutationService } from '@/app/trudi-send-msg/services/trudi-ai-mutation.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  CdkScrollable,
  ConnectedPosition,
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Subject, merge, take, takeUntil, tap } from 'rxjs';
import {
  clearCaret,
  createNewCaret,
  updateCaretPosition
} from '@/app/shared/components/tiny-editor/utils/editor-caret-utils';
import { Editor as TinyMCEEditor } from 'tinymce';
import { removeContentIgnore } from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { AiInteractiveBubbleService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-interactive-bubble.service';
import { mapAiDynamicParams } from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-params-helper';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { ResizableModalPopupComponent } from '@/app/shared/components/resizable-modal';
import { getConfigs } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.helper';
const MESSAGE_MODAL_POSITION = {
  originX: 'end',
  originY: 'top',
  overlayX: 'end',
  overlayY: 'top',
  offsetX: -118,
  offsetY: 8
} as ConnectedPosition;

const INLINE_POSITION = {
  originX: 'end',
  originY: 'bottom',
  overlayX: 'end',
  overlayY: 'bottom',
  offsetX: -118,
  offsetY: -125
} as ConnectedPosition;

export enum InsertPosition {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  EXTRA_LINE = 'EXTRA_LINE'
}

@Injectable({
  providedIn: 'root'
})
export class AiInteractiveBuilderService {
  public aiInteractive: ComponentRef<AiInteractiveBubbleComponent>;
  public bubbleOverlayRef: OverlayRef;

  private editorInstance: TinyMCEEditor = null;
  private isSelectionChanged: boolean = false;
  private isMouseDown: boolean = false;
  private selectionChangeTimeout: NodeJS.Timeout = null;

  public tinyEditorSelectedText$: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  private currentContentTinyEditor: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  public currentContentTinyEditor$ =
    this.currentContentTinyEditor.asObservable();
  private aiWindowState = new BehaviorSubject<EAiWindowState>(null);
  public aiWindowState$ = this.aiWindowState.asObservable();
  private currentFocusState = new Subject<EFocusState>();
  public onInsertTinyEditor$ = new Subject<boolean>();
  public currentFocusState$ = this.currentFocusState.asObservable();
  private showBubbleBS = new BehaviorSubject(false);
  public showInteractiveBubble$ = this.showBubbleBS.asObservable();
  inlineMessage: any;
  get getAIWindowState() {
    return this.aiWindowState.getValue();
  }
  private eventHandlers: { event: string; handler: () => void }[];
  private dynamicVariable$ = new BehaviorSubject(null);
  public dynamicVariableBS = this.dynamicVariable$.asObservable();

  private isCaretsHidden: boolean = true;
  private tinyEditorComponent: TinyEditorComponent;
  public editorFocused = false;
  public insertPosition = {
    elementAt: null,
    position: null,
    greetingElement: null
  };

  constructor(
    private overlay: Overlay,
    private aiDetectPolicyService: AIDetectPolicyService,
    private readonly rxStrategyProvider: RxStrategyProvider
  ) {
    this.eventHandlers = [
      { event: 'init', handler: this.onEditorInit.bind(this) },
      { event: 'click keyup', handler: this.onEditorKeyUp.bind(this) },
      { event: 'mouseup', handler: this.onEditorMouseUp.bind(this) },
      { event: 'blur', handler: this.onEditorBlur.bind(this) },
      { event: 'keydown', handler: this.onEditorKeyDown.bind(this) },
      {
        event: 'SelectionChange',
        handler: this.onEditorSelectionChange.bind(this)
      },
      { event: 'mousedown', handler: this.onEditorMouseDown.bind(this) },
      { event: 'NodeChange', handler: this.onEditorNodeChange.bind(this) },
      { event: 'focus', handler: this.onEditorFocus.bind(this) }
    ];
  }

  public initAiInteractiveBubble(tinyEditorComponent: TinyEditorComponent) {
    this.tinyEditorComponent = tinyEditorComponent;
    this.editorInstance = tinyEditorComponent.tinyEditor?.editor;
    this.handleEditorEvent('on');
  }

  handleEditorEvent(status: 'on' | 'off') {
    if (this.editorInstance) {
      this.eventHandlers.forEach((event) => {
        status === 'on'
          ? this.editorInstance.on(event.event, event.handler)
          : this.editorInstance.off(event.event, event.handler);
      });
    }
  }

  onEditorFocus(value) {
    this.editorFocused = true;
  }

  onEditorInit() {
    const contentTiny = this.editorInstance?.getContent({ format: 'text' });
    this.setContentTinyEditor(contentTiny.trim() || '');
  }

  onEditorKeyUp() {
    const selectedText = this.editorInstance.selection?.getContent({
      format: 'text'
    });
    this.tinyEditorSelectedText$.next(selectedText);
    const body = this.editorInstance.contentDocument?.body;
    let fakeCaret = body?.querySelector('.fake_caret') as HTMLElement;
    if (!fakeCaret && this.getAIWindowState === EAiWindowState.Mutation) {
      createNewCaret(this.editorInstance);
    }
    if (
      this.getAIWindowState === EAiWindowState.Mutation &&
      !selectedText?.length
    ) {
      updateCaretPosition(this.editorInstance);
    }
  }

  onEditorKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      clearCaret(this.editorInstance);

      if (this.aiWindowState.value === EAiWindowState.Mutation) {
        this.applySelectionStyle();
      }
    }
  }

  onEditorMouseUp() {
    const selectedText = this.editorInstance.selection?.getContent({
      format: 'text'
    });
    this.tinyEditorSelectedText$.next(selectedText);
    clearCaret(this.editorInstance);
    if (this.isSelectionChanged) {
      if (this.aiWindowState.value === EAiWindowState.Mutation) {
        this.applySelectionStyle();
      } else {
        this.clearSelectionStyle();
      }
      this.isSelectionChanged = false;
    } else {
      this.clearSelectionStyle();
    }

    this.isMouseDown = false;
  }

  onEditorMouseDown() {
    this.isMouseDown = true;
    this.clearSelectionStyle();
    clearCaret(this.editorInstance);
  }

  onEditorBlur() {
    // clearCaret(this.editorInstance);
  }

  onEditorSelectionChange(value) {
    this.isSelectionChanged = true;
    if (
      !this.isCaretsHidden &&
      this.getAIWindowState === EAiWindowState.Mutation
    ) {
      const selectedText = this.editorInstance.selection?.getContent({
        format: 'text'
      });
      if (!selectedText) {
        this.clearSelectionStyle();
      }
    }
  }

  onEditorNodeChange() {}

  handleSetValueSelectedText(editor) {
    const selectedText = editor.selection?.getContent({ format: 'text' });
    this.tinyEditorSelectedText$.next(selectedText);
  }

  getTextValue(currentText: string, newValue: string, maxCharacter: number) {
    switch (true) {
      case currentText.length >= maxCharacter:
        return '';
      case (currentText + newValue).length > maxCharacter:
        return newValue.slice(0, maxCharacter - currentText.length);
      default:
        return newValue;
    }
  }

  handleInsertTextAtCursor(value: string) {
    const selectedText = this.editorInstance.selection?.getContent({
      format: 'text'
    });
    const currentContent = this.editorInstance?.getContent({
      format: 'text'
    });
    let textValue = value;
    this.onInsertTinyEditor$.next(true);
    const maxCharacter = this.tinyEditorComponent?.maxRemainCharacter;
    this.aiDetectPolicyService.addAIGeneratedText(value);
    textValue = maxCharacter
      ? this.getTextValue(currentContent, value, maxCharacter)
      : value;
    if (selectedText) {
      textValue.length &&
        this.editorInstance.selection.setContent(
          `<span class="${this.aiDetectPolicyService.AI_TEXT_CLASSNAME}">${textValue}</span>`
        );
      this.clearSelectionStyle();
    } else {
      const aiContent = `<span class="${this.aiDetectPolicyService.AI_TEXT_CLASSNAME}">${textValue}</span>`;
      const line = `<p>${aiContent}</p>`;
      switch (this.insertPosition.position) {
        case InsertPosition.BEFORE:
          //insert inside custom style div
          this.editorInstance.insertContent(line);
          break;
        case InsertPosition.AFTER:
          this.editorInstance.insertContent(aiContent);
          break;
        case InsertPosition.EXTRA_LINE:
          this.editorInstance.insertContent(line);
          break;
        default:
          this.editorInstance.insertContent(
            `<span class="${this.aiDetectPolicyService.AI_TEXT_CLASSNAME}">${textValue}</span>`
          );
          break;
      }
    }

    this.tinyEditorComponent.getRawText();
  }

  setDynamicVariable(value) {
    if (!value) return;
    const mapDynamicVariable = mapAiDynamicParams(value);
    this.dynamicVariable$.next(mapDynamicVariable);
  }

  setContentTinyEditor(content: string) {
    const container = document.createElement('div');
    container.innerHTML = content;
    removeContentIgnore(container);
    const resultingText = container.innerText.trim();
    this.currentContentTinyEditor.next(resultingText);
  }

  setCurrentFocusState(value) {
    this.currentFocusState.next(value);
  }

  closeAIReplyPopover() {
    if (this.aiWindowState.value === EAiWindowState.Mutation) {
      this.toggleAIWindowState(null);
    }
  }

  toggleAIWindowState(state: EAiWindowState) {
    const aiWindowState = this.aiWindowState.value !== state ? state : null;
    if (aiWindowState === EAiWindowState.Mutation) {
      this.applySelectionStyle();
      if (!this.editorFocused) {
        this.verifyInsertPosition();
      }
    } else {
      this.clearSelectionStyle();
      clearCaret(this.editorInstance);
    }
    this.aiWindowState.next(aiWindowState);
  }

  public createAiInteractiveBubble(
    tinyEditorComponent: TinyEditorComponent,
    inlineMessage: boolean
  ) {
    this.destroyAiBubble();
    this.setShowInteractiveBubble(true);
    this.initAiInteractiveBubble(tinyEditorComponent);
    const scrollable = tinyEditorComponent.injector.get(CdkScrollable, null);
    this.bubbleOverlayRef = this.overlay.create({
      panelClass: 'interactive-overlay',
      width: 0,
      height: 0,
      scrollStrategy: this.overlay.scrollStrategies.reposition({
        autoClose: false
      }),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(tinyEditorComponent.elementRef.nativeElement)
        .setOrigin(tinyEditorComponent.elementRef.nativeElement)
        .withScrollableContainers([scrollable])
        .withPositions(
          inlineMessage ? [INLINE_POSITION] : [MESSAGE_MODAL_POSITION]
        )
        .withFlexibleDimensions(false)
        .withPush(false)
    });
    const injector = this.createInjector(tinyEditorComponent, inlineMessage);
    const resizableModal = tinyEditorComponent.injector.get(
      ResizableModalPopupComponent,
      null,
      { optional: true }
    );
    const componentPortal = new ComponentPortal(
      AiInteractiveBubbleComponent,
      null,
      injector
    );

    this.aiInteractive = this.bubbleOverlayRef.attach(
      componentPortal
    ) as ComponentRef<AiInteractiveBubbleComponent>;
    this.aiInteractive.setInput('fromInlineMsg', inlineMessage);
    this.aiInteractive.setInput('cdkDragBoundary', '.cdk-overlay-container');
    // this.aiInteractive.setInput('cdkDragRootElement', '.interactive-overlay');
    this.aiInteractive.setInput(
      'configs',
      tinyEditorComponent.aiInteractiveBubbleConfigs
    );
    const destroy$ = new Subject();
    const scroll$ = new Subject();
    this.aiInteractive.instance.cdkDragMoved.pipe(take(1)).subscribe((rs) => {
      destroy$.next(true);
    });

    const listener = () => {
      scroll$.next(true);
    };
    const element = tinyEditorComponent.elementRef.nativeElement.closest(
      '.ant-drawer-body'
    ) as HTMLDivElement;
    const resizeObserver = new ResizeObserver((_) => {
      scroll$.next(true);
    });
    if (element) {
      resizeObserver.observe(element);
      element?.addEventListener('scroll', listener);
    }
    const combinedObs = resizableModal
      ? merge(resizableModal.moved, resizableModal.resized)
      : merge(scroll$);
    combinedObs.pipe(takeUntil(destroy$)).subscribe((rs) => {
      setTimeout(() => {
        this.bubbleOverlayRef.updatePosition();
        this.aiInteractive.instance.aiInteractiveBubbleService.triggerRecalculateSize$.next(
          true
        );
      }, 50);
    });
    return this.aiInteractive.instance.afterClose.pipe(
      tap(() => {
        destroy$.next(true);
        element?.removeEventListener('scroll', listener);
        resizeObserver.disconnect();
      })
    );
  }

  public createInjector(
    tinyEditorComponent: TinyEditorComponent,
    inlineMessage = false
  ) {
    const sendMsgConfigs = getConfigs(tinyEditorComponent);
    const { right, y, bottom } =
      tinyEditorComponent.elementRef.nativeElement.getBoundingClientRect();
    const injector = Injector.create({
      providers: [
        {
          provide: TrudiAIMutationService,
          useFactory: () => {
            const aiMutationService = tinyEditorComponent.injector.get(
              TrudiAIMutationService
            );
            return aiMutationService;
          }
        },
        {
          provide: AIDetectPolicyService,
          useFactory: () => {
            const aiDetectService = tinyEditorComponent.injector.get(
              AIDetectPolicyService
            );
            return aiDetectService;
          }
        },
        {
          provide: AIInteractiveInitialDataToken,
          useValue: {
            dragBoundary: 'body',
            freeDragPosition: {
              x: inlineMessage ? right - 118 : right - 130,
              y: inlineMessage ? bottom - 110 : y
            },
            sendMsgConfigs: sendMsgConfigs,
            listCodeOptions: tinyEditorComponent?.listCodeOptions || []
          } as AiInteractiveBubbleInitialData
        },
        {
          provide: TrudiSendMsgFormService,
          useFactory: () => {
            const trudiSendMsgFormService = tinyEditorComponent.injector.get(
              TrudiSendMsgFormService
            );
            return trudiSendMsgFormService;
          }
        },
        {
          provide: AiInteractiveBuilderService,
          useFactory: () => {
            return this;
          }
        }
      ]
    });
    return injector;
  }

  getTextNode(childNodes: NodeListOf<ChildNode>, isFirstNode) {
    if (!childNodes || childNodes.length === 0) return null;

    let currentNode = isFirstNode
      ? childNodes[0]
      : childNodes[childNodes.length - 1];
    if (currentNode && currentNode.nodeType === Node.TEXT_NODE) {
      return currentNode;
    } else {
      return this.getTextNode(currentNode.childNodes, isFirstNode);
    }
  }

  applySelectionStyle() {
    const self = this;
    clearTimeout(self.selectionChangeTimeout);
    if (self.editorInstance) {
      const selectionContent = self.editorInstance.selection?.getContent();
      const startNode = self.editorInstance.selection?.getStart();
      const endNode = self.editorInstance.selection?.getEnd();
      const selRng = self.editorInstance.selection?.getRng();

      self.selectionChangeTimeout = setTimeout(() => {
        if (selectionContent && selectionContent.trim() !== '') {
          const snLineHeight =
            parseFloat(
              getComputedStyle(startNode).getPropertyValue('font-size')
            ) * 1.14;
          const enLineHeight =
            parseFloat(
              getComputedStyle(endNode).getPropertyValue('font-size')
            ) * 1.14;

          const sel = self.editorInstance.dom.doc.getSelection();
          //Case: select all with the Ctrl + A shortcut
          if (selRng.startContainer.nodeName === 'BODY') {
            //check end node
            const newEndNode = endNode.classList.contains('fake_caret')
              ? endNode.previousSibling
              : endNode;
            const lastTextNode = this.getTextNode(newEndNode.childNodes, false);
            if (lastTextNode) {
              self.editorInstance.selection.setCursorLocation(
                lastTextNode,
                lastTextNode?.nodeValue?.length
              );
            } else {
              self.editorInstance.selection.setCursorLocation(
                newEndNode,
                newEndNode.childNodes.length
              );
            }
            self.editorInstance.selection.setContent(
              `<span class="fake-selection-end" style="--line-height:${
                enLineHeight > 0 ? enLineHeight - 1 : 20
              }px;"></span>`
            );

            //start node
            const firstTextNode = this.getTextNode(startNode.childNodes, true);

            self.editorInstance.selection.setCursorLocation(
              firstTextNode ? firstTextNode : startNode,
              0
            );

            self.editorInstance.selection.setContent(
              `<span class="fake-selection-start" style="--line-height:${
                snLineHeight > 0 ? snLineHeight - 2 : 20
              }px;"></span>`
            );

            const range = self.editorInstance.dom.createRng();
            range.selectNodeContents(self.editorInstance.getBody());
            sel.removeAllRanges();
            sel.addRange(range);
          } else {
            const outRng = selRng.cloneRange();
            let sc = selRng.startContainer;
            const so = selRng.startOffset;
            let ec = selRng.endContainer;
            const eo = selRng.endOffset;

            //must insert end node before start node to avoid the issue out of index
            //because the offset will change after insert to head
            self.editorInstance.selection.setCursorLocation(ec, eo);
            self.editorInstance.selection.setContent(
              `<span class="fake-selection-end" style="--line-height:${
                enLineHeight > 0 ? enLineHeight - 1 : 20
              }px;"></span>`
            );
            self.editorInstance.selection.setCursorLocation(sc, so);
            self.editorInstance.selection.setContent(
              `<span class="fake-selection-start" style="--line-height:${
                snLineHeight > 0 ? snLineHeight - 2 : 20
              }px;"></span>`
            );

            sel.removeAllRanges();
            sel.addRange(outRng);
          }
          this.isCaretsHidden = false;
          self.editorInstance.dom.addClass(
            self.editorInstance.getBody(),
            'highlight-selection'
          );
        } else {
          const body = this.editorInstance.contentDocument?.body;
          let fakeCaret = body?.querySelector('.fake_caret') as HTMLElement;
          !fakeCaret && createNewCaret(this.editorInstance);
          updateCaretPosition(this.editorInstance);
        }
      }, 100);
    }
  }

  clearSelectionStyle() {
    if (this.editorInstance && this.editorInstance.contentDocument) {
      this.isCaretsHidden = true;
      this.editorInstance.contentDocument?.body
        .querySelectorAll('.fake-selection-start, .fake-selection-end')
        .forEach((el) => {
          el.remove();
        });

      this.editorInstance.dom.removeClass(
        this.editorInstance.getBody(),
        'highlight-selection'
      );
    }
  }

  public destroyAiBubble() {
    if (this.aiInteractive) this.aiInteractive.destroy();
    if (this.bubbleOverlayRef) this.bubbleOverlayRef.detach();
    this.handleEditorEvent('off');
    this.setShowInteractiveBubble(false);
    this.aiInteractive = undefined;
    this.bubbleOverlayRef = undefined;
    this.editorFocused = false;
    this.insertPosition = {
      elementAt: null,
      greetingElement: null,
      position: null
    };
  }

  public setShowInteractiveBubble(value: boolean) {
    this.rxStrategyProvider
      .schedule(
        () => {
          if (value === false && this.aiInteractive) {
            this.toggleAIWindowState(null);
            this.aiInteractive.injector
              .get(AiInteractiveBubbleService, null)
              ?.restListInteractiveAi();
          }
          this.showBubbleBS.next(value);
          this.aiInteractive?.setInput('fakeInput', value);
        },
        { strategy: 'immediate' }
      )
      .pipe(take(1))
      .subscribe();
  }

  public verifyInsertPosition() {
    const greeting = this.inlineMessage
      ? this.editorInstance.dom.select('#ai-summary-greeting')
      : this.editorInstance.dom.select('#select-user-greeting');
    if (greeting[0] && greeting[0]?.textContent?.length > 0) {
      const nextSibling = greeting[0].nextElementSibling;
      if (nextSibling && nextSibling?.textContent?.length === 0) {
        this.insertPosition.position = InsertPosition.AFTER;
        this.insertPosition.elementAt = nextSibling;
        this.editorInstance.selection.setCursorLocation(nextSibling, 0);
      } else {
        this.insertPosition.position = InsertPosition.EXTRA_LINE;
        this.insertPosition.greetingElement = greeting[0];
        const element = this.editorInstance.dom.insertAfter(
          greeting[0],
          '<p><br></p>'
        );
        this.insertPosition.elementAt = element;
        this.editorInstance.selection.setCursorLocation(element, 0);
      }
    } else {
      this.insertPosition.position = InsertPosition.BEFORE;
    }
  }

  public getCurrentTinyEditorContent() {
    return this.currentContentTinyEditor.value;
  }
}

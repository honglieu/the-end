import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { AiGeneratedContentComponent } from './components/ai-generated-content/ai-generated-content.component';
import { FormsModule } from '@angular/forms';
import {
  AiInteractiveBubbleInitialData,
  EAiWindowState,
  IInteractiveAi
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { AiInteractiveBubbleService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-interactive-bubble.service';
import { SuggestionButtonContainerComponent } from '@/app/dashboard/components/ai-interactive-bubble/components/ai-interactive-reply/components/suggestion-button-container/suggestion-button-container.component';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  fromEvent,
  takeUntil
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from '@shared/directives/click-outside/click-outside.module';
import { TrudiTextFieldResizeDirective, TrudiUiModule } from '@trudi-ui';
import {
  NzResizableDirective,
  NzResizableModule,
  NzResizeDirection,
  NzResizeEvent
} from 'ng-zorro-antd/resizable';
import {
  AIInteractiveInitialDataToken,
  AI_INTERACTIVE_PLACEHOLDER
} from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { TrudiAIMutationService } from '@/app/trudi-send-msg/services/trudi-ai-mutation.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  getGenerateEmailPayload,
  getMutationChannel
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { NzPopoverDirective, NzPopoverModule } from 'ng-zorro-antd/popover';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';

type PopoverPlacement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';

@Component({
  selector: 'ai-interactive-reply',
  standalone: true,
  imports: [
    AiGeneratedContentComponent,
    SuggestionButtonContainerComponent,
    CommonModule,
    ClickOutsideModule,
    NzPopoverModule,
    FormsModule,
    NzResizableModule,
    TrudiUiModule
  ],
  templateUrl: './ai-interactive-reply.component.html',
  styleUrl: './ai-interactive-reply.component.scss'
})
export class AIInteractiveReplyComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() parentElementRef: ElementRef<HTMLElement>;
  public prompt: string;
  public listInteractiveAi: IInteractiveAi[];
  public isFocusTextarea: boolean = false;
  public isGenerating$: BehaviorSubject<boolean>;
  public aiWindowState: EAiWindowState;
  private unsubscribe$: Subject<void> = new Subject<void>();
  public placeholderInputBox: string = '';
  @ViewChild('trudiTextarea', { read: TrudiTextFieldResizeDirective })
  textAreaResizeDirective: TrudiTextFieldResizeDirective;
  @ViewChild('trudiTextarea') textareaElement;
  @ViewChild('bodyView') bodyView!: ElementRef;
  @ViewChild('aiReplyBtn') aiReplyBtn!: ElementRef<any>;
  @ViewChild('popoverView') public popover: NzPopoverDirective;
  public maxWidth: number;
  public maxHeight: number;
  public minWidth: number;
  public minHeight: number;
  public resizeDirection: string;
  public height: number;
  public width: number;
  public animationId: number;
  public readonly defaultWidth = window.innerWidth * 0.3;
  public readonly EAiWindowState = EAiWindowState;
  public readonly suggestionBoxHeight = 36;
  public readonly defaultHeight: number = 150;
  public readonly defaultMinHeight: number = 108;
  private prevAiContentHeight: number = 0;
  public enabledResizeDirections: NzResizeDirection[] = ['bottom', 'left'];
  constructor(
    private aiInteractiveBubbleService: AiInteractiveBubbleService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    private aiMutationService: TrudiAIMutationService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    @Inject(AIInteractiveInitialDataToken)
    private initialData: AiInteractiveBubbleInitialData,
    private cdkDrag: CdkDrag,
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {
    this.resetBodySize();
  }
  resetBodySize() {
    this.width = Math.min(this.maxWidth, this.defaultWidth);
    this.height = this.defaultHeight;
    this.minHeight = this.defaultMinHeight;
  }
  ngOnInit(): void {
    this.isGenerating$ = this.aiInteractiveBubbleService.isGeneratingText$;
    this.subscribeAiWindowState();
    combineLatest([
      this.aiInteractiveBuilderService.tinyEditorSelectedText$,
      this.aiInteractiveBubbleService.listInteractiveAi$
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([selectedText, listInteractiveAi]) => {
        const textareaElement: HTMLTextAreaElement =
          this.textareaElement?.textareaElem.nativeElement;
        this.listInteractiveAi = listInteractiveAi;
        this.placeholderInputBox = this.listInteractiveAi?.length
          ? AI_INTERACTIVE_PLACEHOLDER.HISTORY_STATE
          : selectedText?.length
          ? AI_INTERACTIVE_PLACEHOLDER.SELECTED_TEXT
          : AI_INTERACTIVE_PLACEHOLDER.NO_SELECTEDTEXT;
        if (!this.prompt) {
          this.textAreaResizeDirective?.resetTextareaHeight(
            textareaElement,
            listInteractiveAi?.length ? 40 : 84
          );
        }
      });
    this.aiInteractiveBubbleService.triggerRecalculateSize$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((rs) => {
        this.popover?.component?.cdr?.detectChanges();
        this.zone.runOutsideAngular(() => {
          this.handleTextGenerating(rs);
          this.popover?.component?.updateByDirective();
        });
      });

    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((rs) => {
        this.setDefaultSize();
      });
  }

  ngAfterViewInit() {
    if (this.popover?.component) {
      this.enabledResizeDirections = this.enabledResizeDirections =
        this.getResizeDirections(
          this.popover.component.preferredPlacement as PopoverPlacement
        );
    }
    this.cdkDrag._dragRef.moved
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        if (this.popover) {
          this.popover?.component?.updateByDirective();
          this.enabledResizeDirections = this.getResizeDirections(
            this.popover.component.preferredPlacement as PopoverPlacement
          );
        }
      });
  }
  getResizeDirections(
    preferredPlacement: PopoverPlacement
  ): NzResizeDirection[] {
    // 'bottomRight',
    //   'bottomLeft',
    //   'topRight',
    //   'topLeft',
    //   'leftTop',
    //   'leftBottom',
    //   'rightTop',
    //   'rightBottom';
    switch (preferredPlacement) {
      case 'bottomRight':
      case 'rightBottom':
        return ['bottom', 'left'];
      case 'bottomLeft':
      case 'leftBottom':
        return ['bottom', 'right'];
      case 'topRight':
      case 'rightTop':
        return ['top', 'left'];
      case 'leftTop':
      case 'topLeft':
        return ['top', 'right'];
      default:
        return ['bottom', 'left'];
    }
  }

  subscribeAiWindowState() {
    this.aiInteractiveBuilderService.aiWindowState$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((state) => {
        this.setDefaultSize();
        this.prompt = '';
        if (
          this.aiWindowState === EAiWindowState.Mutation &&
          state !== this.aiWindowState
        ) {
          this.aiMutationService.setState(
            [],
            this.aiInteractiveBuilderService.getCurrentTinyEditorContent()
          );
        }

        this.aiWindowState = state;
        if (state !== EAiWindowState.Mutation) {
          if (this.aiReplyBtn) {
            this.aiReplyBtn.nativeElement.blur();
          }
        }

        this.prevAiContentHeight = 0;
        const ignoredMessage = this.listInteractiveAi?.find(
          (value) => value.isGenerating
        );
        ignoredMessage &&
          this.aiInteractiveBubbleService.stopGenerating(ignoredMessage.id);
        this.aiInteractiveBubbleService.restListInteractiveAi();
      });
  }

  setDefaultSize() {
    this.maxWidth = window.innerWidth * 0.4;
    this.minWidth = window.innerWidth * 0.25;
    this.maxHeight = window.innerHeight * 0.6;
    this.minHeight = this.defaultMinHeight;
    this.width = Math.min(this.maxWidth, this.defaultWidth);
    this.height = this.defaultHeight;
  }

  handleResize({ width, direction, height }: NzResizeEvent) {
    cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(() => {
      this.width = width!;
      this.height = height!;
      this.resizeDirection = direction!;
    });
  }
  handleTextGenerating(messageId) {
    const aiContent = document.getElementById(messageId);
    const bodyView = document.querySelector('.ai__interactive--body');
    if (!aiContent || !bodyView) return;
    bodyView.scrollTop = bodyView?.scrollHeight || 0;
    if (this.height === this.maxHeight) return;
    this.animationId = requestAnimationFrame(() => {
      const totalHeight =
        this.height +
        Math.abs(
          aiContent.getBoundingClientRect().height - this.prevAiContentHeight
        );
      this.prevAiContentHeight = aiContent.getBoundingClientRect().height;
      this.height = Math.min(totalHeight, this.maxHeight);
    });
  }

  handleTextAreaResize(domRect: DOMRect) {
    if (this.listInteractiveAi?.length) {
      return;
    }
    const textAreaHeight = domRect?.height;
    const newMinHeight = textAreaHeight
      ? textAreaHeight + 60
      : 0 || this.minHeight;
    if (this.minHeight < newMinHeight) {
      this.height = Math.min(
        Math.max(this.height, newMinHeight),
        this.maxHeight
      );
    } else {
      this.height = this.defaultHeight;
    }
  }
  handleOpenInputBox() {
    this.aiInteractiveBuilderService.toggleAIWindowState(
      EAiWindowState.Mutation
    );
  }

  handleFocus() {
    this.isFocusTextarea = true;
  }

  handleBlur() {
    setTimeout(() => {
      this.isFocusTextarea = false;
    }, 150);
  }

  handleSendAi() {
    if (this.isGenerating$.getValue() || !this.prompt?.trim().length) {
      return;
    }
    this.isFocusTextarea = false;
    const payloadData = getGenerateEmailPayload(
      this.trudiSendMsgFormService.sendMsgForm,
      this.initialData.sendMsgConfigs
    );
    this.aiInteractiveBubbleService.setWaitingPrompt(this.prompt.trim());
    this.aiMutationService.generateEmail({
      text: this.prompt.trim(),
      conversationId: payloadData.conversationId,
      propertyId: payloadData.propertyId,
      receiverUserIds: payloadData.receiverUserIds,
      isDynamicVariable: payloadData.isDynamicVariable,
      channel: getMutationChannel(
        this.initialData?.sendMsgConfigs?.otherConfigs?.createMessageFrom
      )
    });
    this.prompt = '';
  }

  handleClickSuggestionBtn() {
    this.prompt = '';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

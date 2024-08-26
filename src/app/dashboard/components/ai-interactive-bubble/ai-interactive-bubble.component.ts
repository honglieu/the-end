import { AIDetectsPolicyComponent } from '@/app/dashboard/components/ai-interactive-bubble/components/ai-detects-policy/ai-detects-policy.component';
import { AIInteractiveReplyComponent } from '@/app/dashboard/components/ai-interactive-bubble/components/ai-interactive-reply/ai-interactive-reply.component';
import { ModalPopupComponent } from '@shared/components/modal-popup/modal-popup';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  AiInteractiveBubbleService,
  DraftEmailResponseDTO
} from './services/ai-interactive-bubble.service';
import { A11yModule } from '@angular/cdk/a11y';
import { AIInteractiveInitialDataToken } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { TrudiAIMutationService } from '@/app/trudi-send-msg/services/trudi-ai-mutation.service';
import { Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { AIDetectPolicyService } from './services/ai-detect-policy.service';
import {
  TrudiAIWebSocketAction,
  TrudiAIWebSocketCommandType
} from '@/app/core/websocket/types';
import { take } from 'rxjs';
import {
  AiInteractiveBubbleInitialData,
  EAiWindowState
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { CommonModule } from '@angular/common';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { TrudiUiModule } from '@trudi-ui';
import { IAiInteractiveBubbleConfigs } from '@/app/shared';

@Component({
  selector: 'ai-interactive-bubble',
  standalone: true,
  imports: [
    AIInteractiveReplyComponent,
    AIDetectsPolicyComponent,
    DragDropModule,
    A11yModule,
    CommonModule,
    TrudiUiModule
  ],
  providers: [AiInteractiveBubbleService, TrudiAIMutationService],
  templateUrl: './ai-interactive-bubble.component.html',
  styleUrl: './ai-interactive-bubble.component.scss',
  hostDirectives: [
    {
      directive: CdkDrag,
      inputs: [
        'cdkDragBoundary',
        'cdkDragFreeDragPosition',
        'cdkDragRootElement'
      ],
      outputs: ['cdkDragMoved']
    }
  ]
})
export class AiInteractiveBubbleComponent implements OnDestroy, OnInit {
  @Input() cdkDragBoundary = '.cdk-overlay-container';
  @Input() cdkDragFreeDragPosition;
  @Input() fromInlineMsg = false;
  @Input() hostZIndex = ModalPopupComponent.lastZIndex;
  @Input() fakeInput;
  @Input() configs: IAiInteractiveBubbleConfigs;
  @Output() afterClose = new EventEmitter();
  public cdkDragMoved = this.cdkDrag.moved;
  private unsubscribe = new Subject<void>();

  public readonly EAiWindowState = EAiWindowState;
  public show: boolean;

  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    private aiDetectPolicyService: AIDetectPolicyService,
    @Inject(AIInteractiveInitialDataToken)
    initialValue: AiInteractiveBubbleInitialData,
    private cdkDrag: CdkDrag,
    private aiMutationService: TrudiAIMutationService,
    public aiInteractiveBubbleService: AiInteractiveBubbleService
  ) {
    ModalPopupComponent.lastZIndex++;
    this.aiInteractiveBuilderService.setDynamicVariable(
      initialValue.listCodeOptions
    );
  }
  ngOnInit() {
    this.aiMutationService.initWS();
    this.aiInteractiveBuilderService.showInteractiveBubble$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.show = rs;
      });
    this.aiMutationService.onThreadJoined$
      .pipe(
        switchMap(() => {
          return this.aiInteractiveBuilderService.currentContentTinyEditor$.pipe(
            debounceTime(0)
          );
        }),
        take(1),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.aiMutationService.setState([], rs);
      });
    this.aiMutationService.onThreadJoined$
      .pipe(
        switchMap(() => {
          return this.aiDetectPolicyService.msgToCheck$;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.aiMutationService.updateEmailState(rs);
        this.aiMutationService.endTyping();
      });

    this.aiMutationService.onMessage$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          switch (rs['payload']['function_name'] || rs?.action) {
            case TrudiAIWebSocketAction.POLICY_DETECTION:
              this.aiDetectPolicyService.detectPoliciesFromMsg(
                rs['payload']['response']
              );
              break;
            case TrudiAIWebSocketCommandType.GENERATE_MESSAGE:
            case TrudiAIWebSocketCommandType.GENERATE_EMAIL:
              const hasId =
                this.aiInteractiveBubbleService.listIgnoredMessageIds.has(
                  rs['message_id']
                );

              !hasId &&
                this.aiInteractiveBubbleService.pushReply(
                  rs as DraftEmailResponseDTO
                );

              break;
            case TrudiAIWebSocketAction.STOP_GENERATE:
              this.aiInteractiveBubbleService.isGeneratingText$.next(false);
              this.aiInteractiveBubbleService.stopGenerating(
                rs['message_id'] as string
              );
              break;
            default:
              break;
          }
        }
      });
  }

  get aiWindowState() {
    return this.aiInteractiveBuilderService.aiWindowState$;
  }

  ngOnDestroy() {
    this.aiInteractiveBubbleService.listIgnoredMessageIds.clear();
    this.aiMutationService.leaveThread();
    this.aiInteractiveBuilderService.toggleAIWindowState(null);
    this.afterClose.emit();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

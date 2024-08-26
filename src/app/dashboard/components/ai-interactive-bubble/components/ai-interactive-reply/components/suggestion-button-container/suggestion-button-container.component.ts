import {
  AiInteractiveBubbleInitialData,
  IInteractiveAi,
  IOptionButton
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { AiInteractiveBubbleApiService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-interactive-bubble-api.service';
import { AiInteractiveBubbleService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-interactive-bubble.service';
import { TrudiUiModule } from '@trudi-ui';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import uuid4 from 'uuid4';
import { isEqual } from 'lodash-es';
import { TrudiAIMutationService } from '@/app/trudi-send-msg/services/trudi-ai-mutation.service';
import {
  focusAIElement,
  getGenerateEmailPayload,
  getMutationChannel
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { AIInteractiveInitialDataToken } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { RxPush } from '@rx-angular/template/push';

@Component({
  selector: 'suggestion-button-container',
  standalone: true,
  imports: [CommonModule, TrudiUiModule, NzDropDownModule, RxPush],
  templateUrl: './suggestion-button-container.component.html',
  styleUrl: './suggestion-button-container.component.scss'
})
export class SuggestionButtonContainerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private selectedText = '';
  private latestAiReply: IInteractiveAi;
  private contentTiny = '';
  public suggestionButtons: IOptionButton[] = [];
  public suggestionList: IOptionButton[] = [];
  private aiInteractiveService = inject(AiInteractiveBubbleService);
  private aiInteractiveBuilderService = inject(AiInteractiveBuilderService);
  private aiInteractiveApiService = inject(AiInteractiveBubbleApiService);
  private aiMutationService = inject(TrudiAIMutationService);
  private trudiSendMsgFormService = inject(TrudiSendMsgFormService);
  isFetching = new Subject<boolean>();
  @Output() clickSuggestionBtn = new EventEmitter();

  public readonly isGeneratingText$ =
    this.aiInteractiveService.isGeneratingText$.asObservable().pipe(
      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

  constructor(
    @Inject(AIInteractiveInitialDataToken)
    private initialData: AiInteractiveBubbleInitialData,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public showSkeleton = this.isFetching.pipe(take(2));

  ngOnInit(): void {
    this.handleSuggestionOptions();
  }

  private handleSuggestionOptions() {
    const selectedText$ =
      this.aiInteractiveBuilderService.tinyEditorSelectedText$;
    const contentTiny$ =
      this.aiInteractiveBuilderService.currentContentTinyEditor$;
    const aiReplyList$ = this.aiInteractiveService.listInteractiveAi$;

    combineLatest([selectedText$, aiReplyList$, contentTiny$])
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200),
        distinctUntilChanged((prev, curr) => {
          const [prvText, prvAiReply, prvTiny] = prev;
          const [currText, currAiReply, currTiny] = curr;
          return (
            isEqual(prvText, currText) &&
            isEqual(prvAiReply, currAiReply) &&
            isEqual(prvTiny, currTiny)
          );
        }),
        switchMap(([selectedText, aiReplyList, contentTiny]) => {
          if (!!selectedText) {
            this.selectedText = selectedText;
            return this.handleGetSuggestionOptions(selectedText);
          } else if (!!aiReplyList?.length) {
            const latestAiReply = aiReplyList[aiReplyList.length - 1];
            this.latestAiReply = latestAiReply;
            return this.handleGetSuggestionOptions(latestAiReply.reply);
          } else {
            this.contentTiny = contentTiny;
            return this.handleGetSuggestionOptions(contentTiny || '');
          }
        })
      )
      .subscribe((res) => {
        this.aiInteractiveService.setSuggestButtons(res.buttons || []);
        if (!res) return;
        this.suggestionList = res.buttons?.slice(2) || [];
      });
  }

  private handleGetSuggestionOptions(text: string) {
    this.isFetching.next(true);
    return this.aiInteractiveApiService
      .getSuggestionOptions({
        mode: 'email',
        text: text || ''
      })
      .pipe(
        tap((res) => {
          this.suggestionButtons = res.buttons?.slice(0, 2) || [];
          this.isFetching.next(false);
        }),
        map((options) => {
          const uuid = uuid4();
          const moreButtons = options?.buttons?.slice(2)?.sort((a, b) => {
            if (a?.label < b?.label) return -1;
            if (a?.label > b?.label) return 1;
            return 0;
          });
          return {
            ...options,
            id: uuid,
            buttons: moreButtons
          };
        })
      );
  }

  public onChangeSuggestion(button: IOptionButton) {
    this.clickSuggestionBtn.emit();
    this.aiInteractiveService.setWaitingPrompt(button?.label?.trim());
    try {
      this.aiInteractiveService.isGeneratingText$.next(true);
      const payloadData = getGenerateEmailPayload(
        this.trudiSendMsgFormService.sendMsgForm,
        this.initialData.sendMsgConfigs
      );
      this.aiMutationService.generateEmail({
        text: button?.prompt || '',
        conversationId: payloadData.conversationId,
        propertyId: payloadData.propertyId,
        receiverUserIds: payloadData.receiverUserIds,
        isDynamicVariable: payloadData.isDynamicVariable,
        channel: getMutationChannel(
          this.initialData.sendMsgConfigs?.otherConfigs?.createMessageFrom
        )
      });
    } catch (err) {
      console.error(err);
      this.aiInteractiveService.isGeneratingText$.next(false);
    }
  }

  onTab(event: KeyboardEvent) {
    event.preventDefault();
    focusAIElement(this.document, this.initialData.sendMsgConfigs);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

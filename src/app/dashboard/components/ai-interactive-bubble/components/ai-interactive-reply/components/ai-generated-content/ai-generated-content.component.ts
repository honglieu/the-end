import { TrudiUiModule } from '@trudi-ui';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import { IInteractiveAi } from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import {
  Observable,
  Subject,
  fromEvent,
  switchMap,
  take,
  takeUntil,
  tap,
  timer
} from 'rxjs';
import { AiInteractiveBubbleService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-interactive-bubble.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { GeneratedContentPipe } from '@/app/dashboard/components/ai-interactive-bubble/pipes/generated-content.pipe';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { TrudiAIMutationService } from '@/app/trudi-send-msg/services/trudi-ai-mutation.service';
import {
  replaceAiTag,
  replaceParamVariables
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { CompanyService } from '@/app/services/company.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ExpandableEllipsisDirective } from '@/app/shared/directives/expandable-ellipsis.directive';
import { RxPush } from '@rx-angular/template/push';
@Component({
  selector: 'ai-generated-content',
  standalone: true,
  imports: [
    TrudiUiModule,
    CommonModule,
    GeneratedContentPipe,
    ExpandableEllipsisDirective,
    RxPush
  ],
  templateUrl: './ai-generated-content.component.html',
  styleUrl: './ai-generated-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiGeneratedContentComponent implements OnInit, OnDestroy {
  @Input() interactiveAi: IInteractiveAi;
  public isShowFullText = false;
  private shouldDestroyGeneratedText$: Subject<void> = new Subject<void>();
  public isGeneratingText$: Observable<boolean>;
  @ViewChild('copyReply') copyReplyElement;
  private unsubscribe = new Subject<void>();
  private crmSystem: ECRMSystem;

  constructor(
    private aiInteractiveBubbleService: AiInteractiveBubbleService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    private clipboard: Clipboard,
    private renderer: Renderer2,
    public elementRef: ElementRef<HTMLElement>,
    private companyService: CompanyService,
    public aiMutationService: TrudiAIMutationService
  ) {}

  ngOnInit(): void {
    this.isGeneratingText$ = this.aiInteractiveBubbleService.isGeneratingText$;
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.crmSystem = res;
      });
  }

  handleShowFullText() {
    this.isShowFullText = !this.isShowFullText;
  }

  handleInsertText() {
    const modifiedText = replaceParamVariables(
      this.interactiveAi.reply,
      this.crmSystem
    )
      .split('\n')
      .join('<br>');
    this.aiInteractiveBuilderService.handleInsertTextAtCursor(modifiedText);
  }

  handleCopy() {
    const element = this.copyReplyElement.nativeElement;

    fromEvent(element, 'click')
      .pipe(
        tap(() => {
          this.renderer.addClass(element, 'highlight');
        }),
        switchMap(() =>
          timer(1500).pipe(
            tap(() => {
              this.renderer.removeClass(element, 'highlight');
            })
          )
        ),
        takeUntil(this.shouldDestroyGeneratedText$),
        take(1)
      )
      .subscribe();

    this.clipboard.copy(replaceAiTag(this.interactiveAi.reply));
  }

  handleStopGeneratingText() {
    this.aiMutationService.stopGenerate(this.interactiveAi.id);
    this.aiInteractiveBubbleService.updateDataInteractiveAi({
      ...this.interactiveAi,
      isGenerating: false
    });
    this.aiInteractiveBubbleService.listIgnoredMessageIds.add(
      this.interactiveAi.id
    );
    this.aiInteractiveBubbleService.isGeneratingText$.next(false);
  }

  ngOnDestroy(): void {
    this.shouldDestroyGeneratedText$.next();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ECreatedFrom } from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { IParticipant } from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Renderer2,
  ChangeDetectorRef,
  InjectionToken,
  Inject
} from '@angular/core';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  retry
} from 'rxjs';
import * as Sentry from '@sentry/angular-ivy';

export const PARTICIPANT_TITLE_CONFIG = new InjectionToken<{
  characterWith: number;
  maxCharacters: number;
}>('PARTICIPANT_TITLE_CONFIG');

@Component({
  selector: 'app-message-participants',
  templateUrl: './message-participants.component.html',
  styleUrls: ['message-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: PARTICIPANT_TITLE_CONFIG,
      useValue: {
        characterWith: 8,
        maxCharacters: 40
      }
    }
  ]
})
export class MessageParticipantsComponent implements AfterViewInit {
  @Input() set participants(participants: IParticipant[]) {
    this.participants$.next(participants);
  }
  @Input() set message(message: TaskItem) {
    this.message$.next(message);
  }
  @Input() set search(search: string) {
    this.search$.next(search);
  }
  @Input() set isDraft(isDraft: boolean) {
    this.isDraft$.next(isDraft);
  }
  @Input() set isDraftFolder(isDraftFolder: boolean) {
    this.isDraftFolder$.next(isDraftFolder);
  }

  private readonly participants$ = new BehaviorSubject<IParticipant[]>([]);
  private readonly search$ = new BehaviorSubject<string>('');
  private readonly message$ = new BehaviorSubject<TaskItem>(null);
  private readonly isDraft$ = new BehaviorSubject<boolean>(false);
  private readonly isDraftFolder$ = new BehaviorSubject<boolean>(false);

  public readonly participantContext$ = combineLatest({
    participants: this.participants$.pipe(filter(Boolean)),
    message: this.message$.pipe(filter(Boolean)),
    search: this.search$.pipe(distinctUntilChanged()),
    isDraft: this.isDraft$.pipe(distinctUntilChanged()),
    isDraftFolder: this.isDraftFolder$.pipe(distinctUntilChanged()),
    isSelectingMode: this.sharedMessageViewService.isSelectingMode$
  }).pipe(
    map((context) => {
      const { participants, message, isDraft, isDraftFolder } = context;
      const receiverParticipants =
        isDraft && isDraftFolder
          ? this.filterReceiverParticipants(participants)
          : participants;
      const composedParticipants = this.composeParticipants(
        receiverParticipants,
        message
      );

      const tooltipTitle = composedParticipants
        .map((participant) => participant.tooltipTitle)
        .join('<br>');

      const { displayParticipants, hiddenParticipants } =
        this.getDisplayAndHiddenParticipants(composedParticipants);
      return {
        ...context,
        participants: composedParticipants,
        displayParticipants,
        hiddenParticipants,
        isReadMessage: message?.conversations?.every(
          (conversation) => conversation.isSeen
        ),
        tooltipTitle,
        isCreatedFromVoiceMail:
          message.conversations[0].createdFrom === ECreatedFrom.VOICE_MAIL
      };
    }),
    retry(3)
  );

  public renderStrategy: RxStrategyNames = 'immediate';

  public remainingParticipants: IParticipant[] = [];
  public participantsText: string;
  public displayParticipants: IParticipant[] = [];
  public hiddenParticipantsCount: number;
  public ECreatedFrom = ECreatedFrom;
  public tooltipListParticipants: string[];
  public readonly isSelectingMode$ =
    this.sharedMessageViewService.isSelectingMode$;

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly cdr: ChangeDetectorRef,
    private readonly contactTitleResolver: ContactTitleByConversationPropertyPipe,
    private readonly sharedMessageViewService: SharedMessageViewService,
    @Inject(PARTICIPANT_TITLE_CONFIG)
    private readonly participantTextConfig: {
      characterWith: number;
      maxCharacters: number;
    }
  ) {}

  ngAfterViewInit(): void {
    this.renderStrategy = 'low';
  }

  private composeParticipants(participants: IParticipant[], message: TaskItem) {
    const result = participants.map((participant) => {
      const transformOptions = {
        isNoPropertyConversation: message.property?.isTemporary,
        isMatchingPropertyWithConversation:
          message.property?.id === participant.propertyId
      };
      const title = this.contactTitleResolver.transform(
        participant,
        transformOptions
      );
      if (!title) {
        this.handleError(
          `title is empty ${JSON.stringify(participant ?? {})} ${JSON.stringify(
            message ?? {}
          )}`
        );
      }
      return {
        ...participant,
        title,
        tooltipTitle: this.contactTitleResolver.transform(participant, {
          ...transformOptions,
          showFullContactRole: true
        })
      };
    });
    if (!result?.length) {
      this.handleError(
        `participants is empty ${JSON.stringify(
          participants ?? {}
        )} ${JSON.stringify(message ?? {})}`
      );
    }
    return result;
  }

  private getDisplayAndHiddenParticipants(composedParticipant: IParticipant[]) {
    let characterCount = 0;
    let displayParticipants = [];
    let hiddenParticipants = [];
    composedParticipant.forEach((participant) => {
      const participantLength = participant.title.length;
      characterCount += participantLength;
      if (characterCount <= this.participantTextConfig.maxCharacters) {
        displayParticipants.push(participant);
      } else {
        hiddenParticipants.push(participant);
      }
    });
    return { displayParticipants, hiddenParticipants };
  }

  private filterReceiverParticipants(participants: IParticipant[]) {
    return participants.filter((participant) =>
      participant?.emailMetadataType?.includes('TO')
    );
  }

  private handleError(error: string) {
    Sentry.captureException(error, {
      level: 'error'
    });
  }
}

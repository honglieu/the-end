import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ECreatedFrom } from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { IParticipant } from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  InjectionToken,
  Inject
} from '@angular/core';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs';

export const PARTICIPANT_TITLE_CONFIG = new InjectionToken<{
  characterWith: number;
  maxCharacters: number;
}>('PARTICIPANT_TITLE_CONFIG');

@Component({
  selector: 'voice-mail-participants',
  templateUrl: './voice-mail-participants.component.html',
  styleUrls: ['voice-mail-participants.component.scss'],
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
export class VoiceMailParticipantsComponent implements AfterViewInit {
  @Input() set participants(participants: IParticipant[]) {
    this.participants$.next(participants);
  }
  @Input() set message(message: TaskItem) {
    this.message$.next(message);
  }
  @Input() set search(search: string) {
    this.search$.next(search);
  }

  private readonly participants$ = new BehaviorSubject<IParticipant[]>([]);
  public readonly search$ = new BehaviorSubject<string>('');
  private readonly message$ = new BehaviorSubject<TaskItem>(null);

  public readonly participantContext$ = combineLatest({
    participants: this.participants$.pipe(filter(Boolean)),
    message: this.message$.pipe(filter(Boolean)),
    search: this.search$.pipe(distinctUntilChanged()),
    isSelectingMode: this.sharedMessageViewService.isSelectingMode$
  }).pipe(
    map((context) => {
      const { participants, message } = context;
      const receiverParticipants = participants;
      const composedParticipants = this.composeParticipants(
        receiverParticipants,
        message
      );
      const { displayParticipants, hiddenParticipants } =
        this.getDisplayAndHiddenParticipants(composedParticipants);

      const tooltipTitle = composedParticipants
        .map((participant) => participant.tooltipTitle)
        .join('<br>');

      return {
        ...context,
        participants: composedParticipants,
        displayParticipants,
        hiddenParticipants,
        tooltipTitle,
        isReadMessage: message?.conversations?.every(
          (conversation) => conversation.isSeen
        ),
        isCreatedFromVoiceMail:
          message.conversations[0].createdFrom === ECreatedFrom.VOICE_MAIL
      };
    })
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
    const isBlockNumber = !message.conversations[0].fromPhoneNumber;
    return participants.map((participant) => {
      const transformOptions = {
        isNoPropertyConversation: message.property?.isTemporary,
        isMatchingPropertyWithConversation:
          message.property?.id === participant.propertyId,
        skipClientName: true
      };
      return isBlockNumber
        ? {
            ...participant,
            title: 'Unknown',
            tooltipTitle: 'Unknown'
          }
        : {
            ...participant,
            title: this.contactTitleResolver.transform(
              participant,
              transformOptions
            ),
            tooltipTitle: this.contactTitleResolver.transform(participant, {
              ...transformOptions,
              showFullContactRole: true
            })
          };
    });
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
}

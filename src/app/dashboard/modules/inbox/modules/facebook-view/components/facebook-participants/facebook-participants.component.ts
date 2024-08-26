import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ECreatedFrom } from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { IParticipant } from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs';
import { ISelectedReceivers } from '@/app/mailbox-setting/utils/out-of-office.interface';

@Component({
  selector: 'facebook-participants',
  templateUrl: './facebook-participants.component.html',
  styleUrl: './facebook-participants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacebookParticipantsComponent implements AfterViewInit {
  @Input() set participants(participants: IParticipant[]) {
    this.participants$.next(participants);
  }
  @Input() set message(message: TaskItem) {
    this.message$.next(message);
  }
  @Input() set search(search: string) {
    this.search$.next(search);
  }
  @Input() emailVerified?: string;

  private readonly participants$ = new BehaviorSubject<IParticipant[]>([]);
  private readonly search$ = new BehaviorSubject<string>('');
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

      const tooltipTitle = composedParticipants
        .map((participant) => participant.tooltipTitle)
        .join('<br>');
      return {
        ...context,
        participants: composedParticipants,
        isReadMessage: message?.conversations?.every(
          (conversation) => conversation.isSeen
        ),
        isUserVerify: message.conversations?.[0].isDetectedContact,
        tooltipTitle,
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
    private readonly sharedMessageViewService: SharedMessageViewService
  ) {}

  ngAfterViewInit(): void {
    this.renderStrategy = 'low';
  }

  private composeParticipants(participants: IParticipant[], message: TaskItem) {
    return participants.map((participant) => {
      const transformOptions = {
        isNoPropertyConversation: message.property?.isTemporary,
        isMatchingPropertyWithConversation:
          message.property?.id === participant.propertyId
      };

      let title = this.contactTitleResolver.transform(
        participant,
        transformOptions
      );

      let tooltipTitle = this.contactTitleResolver.transform(
        {
          ...participant,
          emailVerified: this.emailVerified
        } as ISelectedReceivers,
        {
          ...transformOptions,
          showFullContactRole: true,
          isFacebookContact: true
        }
      );

      return {
        ...participant,
        title,
        tooltipTitle
      };
    });
  }
}

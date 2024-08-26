import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { ECreatedFrom } from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import {
  IParticipant,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  InjectionToken
} from '@angular/core';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { BelongToOtherPropertiesText } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-message-detail-list/components/sms-message-detail-header/sms-message-detail-header.component';

export const PARTICIPANT_TITLE_CONFIG = new InjectionToken<{
  characterWith: number;
  maxCharacters: number;
}>('PARTICIPANT_TITLE_CONFIG');

@Component({
  selector: 'whatsapp-participants',
  templateUrl: './whatsapp-participants.component.html',
  styleUrl: './whatsapp-participants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappParticipantsComponent implements AfterViewInit {
  @Input() set participants(participants: IParticipant[]) {
    this.participants$.next(participants);
  }
  @Input() set message(message: TaskItem) {
    this.message$.next(message);
  }
  @Input() set search(search: string) {
    this.search$.next(search);
  }

  get search() {
    return this.search$.getValue();
  }

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
      const { id: propertyId, isTemporary: isTemporaryProperty } =
        message.property || {};
      return {
        ...context,
        participants: composedParticipants,
        isReadMessage: message?.conversations?.every(
          (conversation) => conversation.isSeen
        ),
        tooltipTitle,
        isCreatedFromVoiceMail:
          message.conversations[0].createdFrom === ECreatedFrom.VOICE_MAIL,
        userInfo: this.smsMessageListService.getUserRaiseMsgFromParticipants({
          ...message.conversations[0],
          propertyId,
          isTemporaryProperty,
          participants: participants || message.conversations[0].participants
        } as UserConversation)
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
  readonly BelongToOtherPropertiesText = BelongToOtherPropertiesText;
  public contactTitleVariable = {
    isNoPropertyConversation: false,
    isMatchingPropertyWithConversation: true
  };

  constructor(
    private readonly contactTitleResolver: ContactTitleByConversationPropertyPipe,
    private readonly sharedMessageViewService: SharedMessageViewService,
    private smsMessageListService: SmsMessageListService
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
      let tooltipTitle = this.contactTitleResolver.transform(participant, {
        ...transformOptions,
        showFullContactRole: true
      });

      if (participant.name) {
        if (title === 'Unknown') {
          title = participant.name;
        }
      }

      return {
        ...participant,
        title,
        tooltipTitle
      };
    });
  }
}

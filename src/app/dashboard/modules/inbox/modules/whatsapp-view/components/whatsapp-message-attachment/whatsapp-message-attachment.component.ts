import { trudiUserId } from '@/app/services/constants';
import {
  EConversationType,
  FileMessage,
  IParticipant,
  PreviewConversation,
  UserProperty
} from '@/app/shared';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  EFileEventEmitType,
  EUserSendType
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.enum';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

@Component({
  selector: 'whatsapp-message-attachment',
  templateUrl: './whatsapp-message-attachment.component.html',
  styleUrl: './whatsapp-message-attachment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappMessageAttachmentComponent implements OnChanges {
  @Input() message: IWhatsappMessage;
  @Input() fileMessage: FileMessage;
  @Input() currentConversation: PreviewConversation;
  @Input() isSending: boolean = false;
  @Input() isUserVerified: boolean = false;

  @Output() readonly emitEventFile = new EventEmitter();

  public trudiUserId = trudiUserId;
  readonly EUserSendType = EUserSendType;
  readonly EFileEventEmitType = EFileEventEmitType;

  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      this.updateLink();
    }
    if (changes['fileMessage']?.currentValue) {
      this.updateFileMessage(this.fileMessage);
    }
  }

  handleEmitEventFile(type, event) {
    this.emitEventFile.emit({ type, event });
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (this.message.userSendType !== EUserSendType.USER) return;

    event.stopPropagation();
    const userId = this.message?.userId;
    const currentDataUserProfile = this.currentConversation?.participants.find(
      (p) => p.userId === userId
    );

    const {
      createdFrom,
      emailVerified,
      channelUserId,
      name,
      propertyId,
      conversationType
    } = this.currentConversation;

    const dataUser = {
      ...(currentDataUserProfile || this.currentConversation),
      createdFrom,
      emailVerified,
      name,
      email:
        this.currentConversation.emailVerified ??
        this.currentConversation.email,
      conversationPropertyId: propertyId,
      fromPhoneNumber:
        (currentDataUserProfile as IParticipant).externalId ||
        (currentDataUserProfile as IParticipant).phoneNumber,
      channelUserId,
      conversationType,
      externalId: (currentDataUserProfile as IParticipant).externalId,
      conversationId: this.currentConversation?.id
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
  urlPattern =
    /(?<!<a\s+href="[^"]*">[^<]*)(https?:\/\/(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(?:\/[^#\s<]+)?)(?![^<]*<\/a>)/g;

  updateLink() {
    if (!this.urlPattern.test(this.message.message)) return;
    this.message = {
      ...this.message,
      message: this.message.message.replace(
        this.urlPattern,
        (url) => `<a href="${url}" target="_blank">${url}</a>`
      )
    };
  }

  updateFileMessage(fileMessage) {
    if (!fileMessage) return;
    this.message = {
      ...this.message,
      file: fileMessage
    };
  }
}

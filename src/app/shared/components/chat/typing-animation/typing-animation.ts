import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { trudiUserId } from '@/app/services/constants';
import { UserService } from '@/app/services/user.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { ConversationService } from '@/app/services/conversation.service';
import { Subject } from 'rxjs/internal/Subject';
import { combineLatest, distinctUntilChanged, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-typing-animation',
  templateUrl: 'typing-animation.html',
  styleUrls: ['./typing-animation.scss']
})
export class TypingAnimationComponent implements OnInit, OnDestroy {
  public isTypingData;
  public trudiUserId = trudiUserId;
  private unsubscribe = new Subject<void>();
  public firstLetterFirstName: string = '';
  public firstLetterLastName: string = '';
  public classAvatar: string = '';
  public isShowTyping: boolean = false;

  constructor(
    private userService: UserService,
    private webSocketService: RxWebsocketService,
    private conversationService: ConversationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    combineLatest([
      this.conversationService.currentConversationId
        .asObservable()
        .pipe(filter(Boolean), distinctUntilChanged()),
      this.webSocketService.onTypingMessage$
        .asObservable()
        .pipe(filter((socketData) => socketData && socketData.params))
    ])
      .pipe(
        filter(
          ([currentConversationId, socketData]) =>
            currentConversationId == socketData.conversationId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([_, socketData]) => {
        try {
          const currentUserId = this.userService.selectedUser?.value?.id;

          if (socketData.userId && socketData.userId === currentUserId) {
            return;
          }

          const params = socketData?.params;
          if (params.sendType === 'typing on' && params.sendType) {
            this.conversationService.isDisplayTypingBlock.next(true);
            this.isTypingData = params;
            this.handleSetAvatarName();
            this.getAvatar(
              this.isTypingData?.userType,
              this.isTypingData?.userId
            );
            this.isShowTyping = true;
          } else {
            this.conversationService.isDisplayTypingBlock.next(false);
            this.isShowTyping = false;
            this.isTypingData = null;
          }

          if (
            this.isShowTyping &&
            socketData &&
            socketData.messageType === 'CALL' &&
            socketData.userId === currentUserId
          ) {
            this.conversationService.isDisplayTypingBlock.next(false);
            this.isTypingData = null;
          }
        } catch (e) {
          console.log(e);
        } finally {
          this.cdr.detectChanges();
        }
      });
  }

  getAvatar(userType: string, userId: string) {
    if (
      userType === 'AGENT' ||
      userId === this.userService.selectedUser.value.id
    ) {
      this.classAvatar =
        userId === this.trudiUserId ? 'trudi-avatar' : 'admin-avatar';
    } else {
      this.classAvatar = 'user-avatar';
    }
  }

  handleSetAvatarName() {
    if (this.isTypingData?.googleAvatar) return;
    this.firstLetterFirstName = this.isTypingData?.firstName?.charAt(0);
    this.firstLetterLastName = this.isTypingData?.lastName?.charAt(0);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

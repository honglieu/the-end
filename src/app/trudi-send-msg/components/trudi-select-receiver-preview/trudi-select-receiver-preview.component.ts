import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import uuid4 from 'uuid4';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';

import { EUserPropertyType } from '@shared/enum/user.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { MAP_TYPE_RECEIVER_TO_LABEL } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EMAIL_PATTERN } from '@services/constants';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

const NUMBER_OF_CHARACTERS_THAT_ALLOWED = 20;
const NUMBER_OF_CHARACTERS_THAT_ALLOWED_FOR_ONE_USER = 30;

@Component({
  selector: 'trudi-select-receiver-preview',
  templateUrl: './trudi-select-receiver-preview.component.html',
  styleUrls: ['./trudi-select-receiver-preview.component.scss']
})
export class TrudiSelectReceiverPreviewComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('previewReceivers') previewReceivers: ElementRef;
  @ViewChild('previewReceiversLabel') previewReceiversLabel: ElementRef;

  vId: string = `label-${uuid4()}`;

  @Input() selectedProperty: UserPropertyInPeople;
  @Input() toRawUsers: any[];
  @Input() toRawCcUsers: any[];
  @Input() toRawBccUsers: any[];
  @Input() prefixToTitle: string = 'To: ';
  @Input() dataAsGroupTask: boolean = false;
  @Input() recipientGroupByTask = [];
  @Input() allowCustomReceiverNameLength: boolean = false;
  @Input() numberOfCharactersThatAllowed: number =
    NUMBER_OF_CHARACTERS_THAT_ALLOWED;
  @Input() numberOfCharactersThatAllowedForOneUser: number =
    NUMBER_OF_CHARACTERS_THAT_ALLOWED_FOR_ONE_USER;

  private unsubscribe = new Subject<void>();

  constructor(
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe
  ) {}

  ngOnChanges(): void {
    if (
      this.previewReceivers?.nativeElement &&
      this.previewReceiversLabel?.nativeElement
    )
      this.generateData();
  }

  ngAfterViewInit(): void {
    if (this.dataAsGroupTask) {
      setTimeout(() => {
        this.generateData();
      });
    } else {
      this.generateData();
    }
  }

  transformedUsers(toRawUsers: string[] | ISelectedReceivers[]): {
    name: string;
    type?: string;
    isToField: boolean;
  }[] {
    return toRawUsers.map((item) => {
      if (typeof item === 'string') {
        return EMAIL_PATTERN.test(item)
          ? {
              name: item + ' (Unrecognized)',
              type: EUserPropertyType.UNIDENTIFIED,
              isToField: true
            }
          : {
              name: item,
              isToField: true
            };
      } else if (EMAIL_PATTERN.test(item?.id)) {
        return {
          name: item?.email + ' (Unrecognized)',
          type: EUserPropertyType.UNIDENTIFIED,
          isToField: true
        };
      }
      return item;
    });
  }

  generateData() {
    const toUsers = this.transformedUsers(this.toRawUsers as any[]).map((u) =>
      this.formatReceiverTitle(u)
    );
    const ccUsers = (this.toRawCcUsers as any[]).map((u) =>
      this.formatReceiverTitle(u, true)
    );
    const bccUsers = (this.toRawBccUsers as any[]).map((u) =>
      this.formatReceiverTitle(u, true)
    );

    if (
      this.previewReceivers?.nativeElement &&
      this.previewReceiversLabel?.nativeElement
    ) {
      const totalWidth = (this.previewReceivers.nativeElement as HTMLElement)
        .scrollWidth;
      const content = document.querySelector(`#${this.vId}`) as HTMLElement;
      content.innerHTML = '';

      let labelIndex = 0,
        isBreak = false,
        moreNumber = toUsers.length,
        ccNumber = ccUsers.length,
        bccNumber = bccUsers.length;

      if (moreNumber === 0 && ccNumber === 0 && bccNumber === 0) {
        const span = document.createElement('span');
        span.innerHTML = 'To:';
        span.classList.add('mr-12');
        span.classList.add('pseudo-prefix');
        content.appendChild(span);
        const span1 = document.createElement('span');
        span1.innerHTML = 'Search name, email or property address';
        span1.classList.add('to-place-holder');
        content.appendChild(span1);
        return;
      }

      const hasInvalidContactInTo = toUsers.some((u) => u.isUnidentified);
      const hasInvalidContactInCc = ccUsers.some((u) => u.isUnidentified);
      const hasInvalidContactInBcc = bccUsers.some((u) => u.isUnidentified);
      const invalidReceiverClass = 'invalid-receiver';
      //To users
      for (let idx = 0; idx < toUsers.length; idx++) {
        labelIndex = idx;
        if (idx === 0) {
          this.appendSeparate(
            content,
            this.prefixToTitle,
            hasInvalidContactInTo ||
              hasInvalidContactInCc ||
              hasInvalidContactInBcc
              ? [invalidReceiverClass]
              : []
          );
        }
        this.appendParticipant(
          content,
          toUsers[idx],
          idx === 0,
          moreNumber === 1 && ccNumber === 0 && bccNumber === 0
        );
        moreNumber -= 1;

        if (content.scrollWidth > totalWidth) {
          isBreak = true;
          break;
        } else if (labelIndex < toUsers.length - 1) {
          this.appendSeparate(content);
        }
      }

      if (!isBreak) {
        //Cc users
        labelIndex = 0;
        for (let idx = 0; idx < ccUsers.length; idx++) {
          labelIndex = idx;
          if (idx === 0) {
            this.appendSeparate(
              content,
              `${toUsers.length > 0 ? ', ' : ''}Cc: `,
              toUsers.length === 0 &&
                (hasInvalidContactInCc || hasInvalidContactInBcc)
                ? [invalidReceiverClass]
                : []
            );
          }
          this.appendParticipant(content, ccUsers[idx]);
          ccNumber -= 1;

          if (content.scrollWidth > totalWidth) {
            isBreak = true;
            break;
          } else if (labelIndex < ccUsers.length - 1) {
            this.appendSeparate(content);
          }
        }
      }

      if (!isBreak) {
        //Bcc users
        labelIndex = 0;
        for (let idx = 0; idx < bccUsers.length; idx++) {
          labelIndex = idx;
          if (idx === 0) {
            this.appendSeparate(
              content,
              `${toUsers.length > 0 || ccUsers.length > 0 ? ', ' : ''}Bcc: `,
              toUsers.length === 0 &&
                ccUsers.length === 0 &&
                hasInvalidContactInBcc
                ? [invalidReceiverClass]
                : []
            );
          }
          this.appendParticipant(content, bccUsers[idx]);
          bccNumber -= 1;

          if (content.scrollWidth > totalWidth) {
            isBreak = true;
            break;
          } else if (labelIndex < bccUsers.length - 1) {
            this.appendSeparate(content);
          }
        }
      }

      // End
      this.appendMoreText(moreNumber, ccNumber, bccNumber);

      while (content.scrollWidth > totalWidth) {
        if (
          (content.lastChild as HTMLElement).className?.includes('number-more')
        ) {
          content.removeChild(content.lastChild);
        }

        if (
          (content.lastChild as HTMLElement).className?.includes('user-email')
        ) {
          if (
            moreNumber >= 0 &&
            ccNumber === ccUsers.length &&
            bccNumber === bccUsers.length
          ) {
            moreNumber += 1;
          } else if (ccNumber >= 0 && bccNumber === bccUsers.length) {
            ccNumber += 1;
          } else if (bccNumber >= 0) {
            bccNumber += 1;
          }
          content.removeChild(content.lastChild);
        }

        if (
          (content.lastChild as HTMLElement).className?.includes('separate-el')
        ) {
          content.removeChild(content.lastChild);
        }

        this.appendMoreText(moreNumber, ccNumber, bccNumber);
      }
    }
  }

  formatReceiverTitle(receiver, ignoreCcBcc: boolean = false) {
    const fullName = receiver?.isToField
      ? MAP_TYPE_RECEIVER_TO_LABEL[receiver.name]
        ? MAP_TYPE_RECEIVER_TO_LABEL[receiver.name]
        : receiver.name
      : this.contactTitleByConversationPropertyPipe.transform(
          receiver,
          this.dataAsGroupTask
            ? {
                isNoPropertyConversation: ignoreCcBcc
                  ? false
                  : !receiver?.propertyId,
                isMatchingPropertyWithConversation:
                  this.recipientGroupByTask.some(
                    (item) => item?.propertyId === receiver?.propertyId
                  ),
                showFullContactRole: true
              }
            : {
                isNoPropertyConversation: !this.selectedProperty,
                isMatchingPropertyWithConversation:
                  this.selectedProperty &&
                  receiver?.propertyId === this.selectedProperty?.id
              }
        );

    if (
      (!receiver.type || receiver.type === EUserPropertyType.UNIDENTIFIED) &&
      receiver?.isValid === false
    )
      return {
        content: fullName,
        isUnidentified: true
      };

    return {
      content: fullName,
      isUnidentified: false
    };
  }

  appendParticipant(
    content: HTMLElement,
    user,
    isFirstUser?: boolean,
    hasOneToAndNoCcBcc?: boolean
  ) {
    const span = document.createElement('span');
    const classNames = ['user-email'];
    if (user.isUnidentified) {
      classNames.push('unidentified-contact');
    }
    span.classList.add(...classNames);
    const defaultContent = user.content;
    const maxLength =
      isFirstUser && this.allowCustomReceiverNameLength
        ? hasOneToAndNoCcBcc
          ? this.numberOfCharactersThatAllowedForOneUser
          : this.numberOfCharactersThatAllowed
        : defaultContent.length;
    span.innerHTML =
      defaultContent.length > maxLength
        ? defaultContent.substring(0, maxLength) + '...'
        : defaultContent;
    content.appendChild(span);
  }

  appendSeparate(
    content: HTMLElement,
    separate: string = ', ',
    classNames: string[] = []
  ) {
    const span = document.createElement('span');
    span.innerHTML = separate;
    const classList = ['separate-el'];
    if (classNames.length > 0) {
      classList.push(...classNames);
    }
    span.classList.add(...classList);

    content.appendChild(span);
  }

  appendMoreText(moreNumber: number, ccNumber: number, bccNumber: number) {
    const moreText: string[] = [];
    const totalCc = this.toRawCcUsers.length;
    const totalBcc = this.toRawBccUsers.length;

    if (moreNumber > 0) {
      moreText.push(`+${moreNumber}`);
    }
    if (ccNumber > 0) {
      moreText.push(totalCc > ccNumber ? `+${ccNumber}` : `${ccNumber} Cc`);
    }
    if (bccNumber > 0) {
      moreText.push(
        totalBcc > bccNumber ? `+${bccNumber}` : `${bccNumber} Bcc`
      );
    }

    if (moreText.length > 0) {
      const content = document.querySelector(`#${this.vId}`) as HTMLElement;
      const span = document.createElement('span');
      span.classList.add('number-more');
      span.innerHTML = `, ${moreText.join(', ')}`;
      content.appendChild(span);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

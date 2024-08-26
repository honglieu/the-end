import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
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

import { EUserPropertyType } from '@shared/enum/user.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { SUFFIX_INVALID_EMAIL_ID } from '@/app/trudi-send-msg/components/confirm-recipient-modal/send-email-to.service';
import { MAP_TYPE_RECEIVER_TO_LABEL } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'select-receiver-preview',
  templateUrl: './select-receiver-preview.component.html',
  styleUrl: './select-receiver-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectReceiverPreviewComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('previewReceivers') previewReceivers: ElementRef;
  @ViewChild('previewReceiversLabel') previewReceiversLabel: ElementRef;

  vId: string = `label-${uuid4()}`;

  @Input() selectedProperty: UserPropertyInPeople;
  @Input() toRawUsers: any[];
  @Input() toRawCcUsers: any[];
  @Input() toRawBccUsers: any[];
  @Input() prefix: string;
  @Input() placeholder: string;
  @Input() recipientGroupByTask;
  @Input() dataAsGroupTask: boolean = false;

  private unsubscribe = new Subject<void>();

  constructor(
    private el: ElementRef,
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
    setTimeout(() => {
      this.generateData();
    });
  }

  mapToFieldToObject(toRawUsers: string[] | ISelectedReceivers[]): {
    name: string;
    type?: string;
    isToField: boolean;
  }[] {
    return toRawUsers.map((item) => {
      if (typeof item === 'string') {
        return item.toString().endsWith(SUFFIX_INVALID_EMAIL_ID)
          ? {
              name: item,
              type: EUserPropertyType.UNIDENTIFIED,
              isToField: true
            }
          : {
              name: item,
              isToField: true
            };
      }
      return item;
    });
  }

  generateData() {
    const toUsers = this.mapToFieldToObject(this.toRawUsers as any[]).map((u) =>
      this.formatReceiverTitle(u)
    );
    const ccUsers = (this.toRawCcUsers as any[]).map((u) =>
      this.formatReceiverTitle(u)
    );
    const bccUsers = (this.toRawBccUsers as any[]).map((u) =>
      this.formatReceiverTitle(u)
    );

    if (
      this.previewReceivers?.nativeElement &&
      this.previewReceiversLabel?.nativeElement
    ) {
      const totalWidth = (this.previewReceivers.nativeElement as HTMLElement)
        .scrollWidth;
      const content = this.el.nativeElement.querySelector(
        `#${this.vId}`
      ) as HTMLElement;
      content.innerHTML = '';

      let labelIndex = 0,
        isBreak = false,
        moreNumber = toUsers.length,
        ccNumber = ccUsers.length,
        bccNumber = bccUsers.length;

      if (moreNumber === 0 && ccNumber === 0 && bccNumber === 0) {
        const span = document.createElement('span');
        span.innerHTML = `${this.prefix}:`;
        span.classList.add('mr-12');
        span.classList.add('pseudo-prefix');
        span.classList.add('preview-color');
        content.appendChild(span);
        const span1 = document.createElement('span');
        span1.innerHTML = this.placeholder;
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
            `${this.prefix}: `,
            hasInvalidContactInTo ||
              hasInvalidContactInCc ||
              hasInvalidContactInBcc
              ? [invalidReceiverClass]
              : []
          );
        }
        this.appendParticipant(content, toUsers[idx]);
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
          (content.lastChild as HTMLElement).className?.includes('receiver')
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

  formatReceiverTitle(receiver) {
    const fullName = receiver?.isToField
      ? MAP_TYPE_RECEIVER_TO_LABEL[receiver.name]
        ? MAP_TYPE_RECEIVER_TO_LABEL[receiver.name]
        : receiver.name
      : this.contactTitleByConversationPropertyPipe.transform(
          receiver,
          this.dataAsGroupTask
            ? {
                isNoPropertyConversation: !this.recipientGroupByTask?.some(
                  (item) =>
                    item?.propertyId || item?.id === receiver?.propertyId
                ),
                isMatchingPropertyWithConversation: true,
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
      (receiver?.isToField &&
        !!receiver?.type &&
        receiver?.type === EUserPropertyType.UNIDENTIFIED) ||
      ((!receiver?.type || receiver?.type === EUserPropertyType.UNIDENTIFIED) &&
        receiver?.isInvalid === true)
    ) {
      return {
        content: fullName,
        isUnidentified: true
      };
    }

    return {
      content: fullName,
      isUnidentified: false
    };
  }

  appendParticipant(content: HTMLElement, user) {
    const span = document.createElement('span');
    const classNames = ['receiver'];
    if (user.isUnidentified) {
      classNames.push('unidentified-contact');
    }
    span.classList.add(...classNames);
    span.innerHTML = user.content;
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
      const content = this.el.nativeElement.querySelector(
        `#${this.vId}`
      ) as HTMLElement;
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

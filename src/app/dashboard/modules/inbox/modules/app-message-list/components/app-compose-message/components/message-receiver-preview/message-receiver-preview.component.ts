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
import { UserPropertyInPeople } from '@shared/types/user-property.interface';

import { EUserPropertyType } from '@shared/enum/user.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'message-receiver-preview',
  templateUrl: './message-receiver-preview.component.html',
  styleUrls: ['./message-receiver-preview.component.scss']
})
export class MessageReceiverPreviewComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('previewReceivers') previewReceivers: ElementRef;
  @ViewChild('previewReceiversLabel') previewReceiversLabel: ElementRef;

  vId: string = `label-${uuid4()}`;

  @Input() selectedProperty: UserPropertyInPeople;
  @Input() toRawUser: ISelectedReceivers;

  private unsubscribe = new Subject<void>();

  constructor(
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
    this.generateData();
  }

  generateData() {
    const toUser = this.toRawUser
      ? this.formatReceiverTitle(this.toRawUser)
      : null;
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
        moreNumber = toUser ? 1 : 0;

      if (moreNumber === 0) {
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

      const hasInvalidContactInTo = toUser?.isUnidentified;
      const invalidReceiverClass = 'invalid-receiver';
      //To users

      labelIndex = 0;

      this.appendSeparate(
        content,
        'To: ',
        hasInvalidContactInTo ? [invalidReceiverClass] : []
      );

      this.appendParticipant(content, toUser);
      moreNumber -= 1;

      if (content.scrollWidth > totalWidth) {
        isBreak = true;
      } else if (labelIndex < 0) {
        this.appendSeparate(content);
      }

      // End
      this.appendMoreText(moreNumber);

      // while (content.scrollWidth > totalWidth) {
      //   if (
      //     (content.lastChild as HTMLElement).className?.includes('number-more')
      //   ) {
      //     content.removeChild(content.lastChild);
      //   }

      //   if (
      //     (content.lastChild as HTMLElement).className?.includes('user-email')
      //   ) {
      //     if (moreNumber >= 0) {
      //       moreNumber += 1;
      //     }
      //     content.removeChild(content.lastChild);
      //   }

      //   if (
      //     (content.lastChild as HTMLElement).className?.includes('separate-el')
      //   ) {
      //     content.removeChild(content.lastChild);
      //   }

      //   this.appendMoreText(moreNumber);
      // }
    }
  }

  formatReceiverTitle(receiver) {
    const fullName = this.contactTitleByConversationPropertyPipe.transform(
      receiver,
      {
        isNoPropertyConversation: !this.selectedProperty,
        isMatchingPropertyWithConversation:
          this.selectedProperty &&
          receiver?.propertyId === this.selectedProperty?.id,
        skipClientName: true
      }
    );
    const role = this.contactTitleByConversationPropertyPipe.transform(
      receiver,
      {
        isNoPropertyConversation: false,
        isMatchingPropertyWithConversation: true,
        showOnlyRole: true
      }
    );
    const bulletPoint = '&#x2022;';
    const shortenStreetLine =
      receiver?.shortenStreetLine ||
      receiver?.shortenStreetline ||
      receiver?.streetline ||
      receiver?.streetLine ||
      'No property';
    const content = `${fullName} (${role}) ${bulletPoint} ${shortenStreetLine}`;

    const isUnidentified =
      (!receiver.type || receiver.type === EUserPropertyType.UNIDENTIFIED) &&
      receiver?.isValid === false;

    return {
      content,
      isUnidentified
    };
  }

  appendParticipant(content: HTMLElement, user) {
    const span = document.createElement('span');
    const classNames = ['user-email'];
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

  appendMoreText(moreNumber: number) {
    const moreText: string[] = [];

    if (moreNumber > 0) {
      moreText.push(`+${moreNumber}`);
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

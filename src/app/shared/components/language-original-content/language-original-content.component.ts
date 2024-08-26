import { mapThreeDotsForMessage } from '@shared/feature/function.feature';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ETooltipQuoteMessage } from '@shared/types/message.interface';

@Component({
  selector: 'language-original-content',
  templateUrl: './language-original-content.component.html',
  styleUrls: ['./language-original-content.component.scss']
})
export class LanguageOriginalContentComponent
  implements OnChanges, AfterViewInit
{
  @Input() content: string;
  @Input() senderType: string;
  @Input() isOpenDescription: boolean = false;

  showTranslatedContent: boolean = false;
  public isShowQuote: boolean = false;
  public emailQuote: HTMLDivElement;
  private regexTag =
    /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<link\b[^>]*>/gi;
  constructor(private elr: ElementRef) {}
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpenDescription']) {
      if (!this.isOpenDescription) this.showTranslatedContent = false;
    }
    if (changes['content']?.currentValue) {
      this.content = mapThreeDotsForMessage({
        message: this.content
      }).replace(this.regexTag, '');
    }
  }

  ngAfterViewInit() {
    this.showEmailQuote();
  }

  showEmailQuote() {
    this.emailQuote =
      this.elr.nativeElement.querySelector('div.gmail_quote') ||
      this.elr.nativeElement.querySelector('div.email-quote');
    if (this.emailQuote) {
      const content =
        this.elr.nativeElement.querySelector('div.text-value')?.children?.[0];
      this.emailQuote.style.whiteSpace = 'normal';
      this.emailQuote.classList.add('mt-12');
      const divEmpty = document.createElement('div');
      const btnWrapper = document.createElement('button');
      const tooltipElement = document.createElement('span');
      const btnElement = document.createElement('img');

      btnElement.src = '/assets/icon/show-more-icon.svg';
      btnWrapper.classList.add('btn-toggle-est', 'gmail-quote-button');
      tooltipElement.classList.add('tooltip-quote', 'gmail-quote-tooltip');
      tooltipElement.innerHTML = ETooltipQuoteMessage.SHOW_QUOTE;
      btnWrapper.appendChild(btnElement);
      btnWrapper.appendChild(tooltipElement);
      btnWrapper.addEventListener('click', () => {
        this.onToggleQuote(this.emailQuote);
        tooltipElement.innerHTML = this.isShowQuote
          ? ETooltipQuoteMessage.HIDE_QUOTE
          : ETooltipQuoteMessage.SHOW_QUOTE;
      });
      content && content?.parentNode?.insertBefore(divEmpty, content);
      this.emailQuote.parentNode.insertBefore(btnWrapper, this.emailQuote);
      this.emailQuote?.classList.add('hide');
    }
  }

  onHideOriginalContent() {
    const tooltipElement = this.elr.nativeElement.querySelector(
      'span.gmail-quote-tooltip'
    );
    if (this.emailQuote && tooltipElement) {
      this.emailQuote?.classList.add('hide');
      this.isShowQuote = false;
      tooltipElement.innerHTML = ETooltipQuoteMessage.SHOW_QUOTE;
    }
  }

  onToggleQuote = (elementQuote) => {
    if (elementQuote.classList.contains('hide')) {
      elementQuote?.classList.remove('hide');
      this.isShowQuote = true;
    } else {
      elementQuote?.classList.add('hide');
      this.isShowQuote = false;
    }
  };
}

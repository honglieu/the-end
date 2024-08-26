import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Subject, filter, takeUntil } from 'rxjs';
import { MessageService } from '@services/message.service';
import {
  coverIframeHeight,
  handleIframeImageErrors,
  updateIframeHeight
} from '@shared/feature/function.feature';
import { IMessage } from '@shared/types/message.interface';

@Component({
  selector: 'iframe-message',
  templateUrl: './iframe-message.component.html',
  styleUrls: ['./iframe-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IframeMessageComponent
  implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy
{
  @ViewChild('myFrame') myFrame: ElementRef;
  @Input() htmlContent: string;
  @Input() message: IMessage;
  @Input() triggerAddPolicyPopup: boolean = false;
  @Output() contentLoadSuccess = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();
  private afterViewInit: boolean = false;
  private iframeClickListener: () => void;

  constructor(private messageService: MessageService, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.subscribeMessageChangeIframeId();
  }

  subscribeMessageChangeIframeId() {
    this.messageService
      .getMessageChangeIframeId()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((messageId) => !!messageId)
      )
      .subscribe((messageId) => {
        if (messageId === this.message?.id && this.myFrame?.nativeElement) {
          updateIframeHeight(this.myFrame?.nativeElement);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.afterViewInit &&
      changes['htmlContent']?.currentValue &&
      this.htmlContent !== changes['htmlContent']?.previousValue
    ) {
      this.onLoadIFrame();
    }
  }

  ngAfterViewInit(): void {
    this.onLoadIFrame();
    this.afterViewInit = true;
  }

  onLoadIFrame() {
    const iframe = this.myFrame?.nativeElement;
    if (!iframe) return;
    iframe.src = 'about:blank';
    this.ngZone.runOutsideAngular(() => {
      iframe.onload = () => {
        this.loadContent();
        iframe.contentWindow.document.body
          .querySelectorAll('a')
          .forEach((res) => {
            res.target = '_blank';
          });
      };
    });
  }

  ngAfterViewChecked() {
    const iframe = this.myFrame?.nativeElement;
    if (iframe && iframe.style.height === '20px') {
      iframe.contentWindow.document.body.scrollHeight &&
        updateIframeHeight(iframe);
    }
  }

  loadContent() {
    const iframe = this.myFrame?.nativeElement;
    if (!iframe) return;
    // TODO: check with outlook
    // if (htmlContent.startsWith('<html')) {
    //   htmlContent = '<!DOCTYPE html>' + htmlContent;
    // }
    const body = document.querySelector('body');
    iframe.contentWindow.document.open();

    iframe.contentWindow.document.write(this.htmlContent);
    handleIframeImageErrors(iframe);
    iframe.contentWindow.document.close();
    coverIframeHeight(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    // workaround to force close visiable dropdown
    this.iframeClickListener = () => {
      body.click();
    };
    iframeDoc.addEventListener('click', this.iframeClickListener);

    const style = iframeDoc.createElement('style');
    const styleContent = `
      ::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      ::-webkit-scrollbar-track {
        border-radius: 5px;
        background: #ffffff;
      }

      ::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background: rgba(107, 105, 108, 0.46);
      }

      ::-webkit-scrollbar-thumb:window-inactive {
        background: rgba(107, 105, 108, 0.46);
      }

      body {
        overflow-y: hidden;
        font-family: Work sans, sans-serif;
        font-weight: 400;
        font-size: 14px;
        font-variant: tabular-nums;
        font-feature-settings: 'tnum';
        margin: 0;
        color: rgb(61, 61, 61);
      }
    `;
    style.appendChild(iframeDoc.createTextNode(styleContent));
    // Comment to debug
    const headTag =
      iframeDoc.head || iframeDoc.getElementsByTagName('head')?.[0];
    if (headTag) {
      headTag.appendChild(style);
    }

    this.contentLoadSuccess.emit(true);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    const iframe = this.myFrame?.nativeElement;
    if (iframe) {
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc)
        iframeDoc.removeEventListener('click', this.iframeClickListener);
      iframe.onload = null;
      iframe.src = 'about:blank';
      try {
        if (iframe?.contentWindow?.document) {
          iframe.contentWindow.document.write('');
          iframe.contentWindow.document.clear();
        }
      } catch (e) {
        console.error('Error clearing iframe content:', e);
      }
      iframe.remove();
    }
  }
}

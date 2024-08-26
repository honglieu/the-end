import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { PhotoType } from '@shared/types/task.interface';
import { IEmailImport } from '@/app/share-pop-up/email-import-pop-up/interfaces/import-email.interface';
import { SharedService } from '@services/shared.service';
import {
  handleIframeImageErrors,
  isHtmlContent
} from '@shared/feature/function.feature';

@Component({
  selector: 'email-preview',
  templateUrl: './email-preview.component.html',
  styleUrls: ['./email-preview.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmailPreviewComponent implements OnInit {
  @Input() crmStatus = '';
  @Input() isImporting = false;
  @Input() currentMailbox = null;
  @Input() visible = false;
  @Input() previewData: IEmailImport = null;
  @Input() listFileSelected: PhotoType[] = [];
  @Output() handleClose = new EventEmitter();
  @Output() handleBack = new EventEmitter();
  @Output() handleImport = new EventEmitter();

  public isConsole = false;
  public htmlContent = '';
  public isShowIframeContent = false;
  public files = [];
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    if (this.previewData) {
      this.files = this.previewData.files;
    }
    this.isConsole = this.sharedService.isConsoleUsers();
    this.bindContent();
  }

  bindContent() {
    if (
      isHtmlContent(this.previewData.htmlContent) &&
      this.previewData.textContent
    ) {
      this.isShowIframeContent = true;
    } else {
      this.isShowIframeContent = false;
    }
    this.htmlContent = this.previewData?.htmlContent?.replace(
      /<a/g,
      '<a target="_blank" '
    );
  }

  loadHtmlContent(event) {
    const iframe = event.target;

    if (!iframe) return;
    let htmlContent = this.htmlContent;
    // TODO: check with outlook
    // if (htmlContent.startsWith('<html')) {
    //   htmlContent = '<!DOCTYPE html>' + htmlContent;
    // }
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    handleIframeImageErrors(iframe);
    iframe.contentWindow.document.close();
    iframe.style.height = '450px';

    const style = iframe.contentWindow.document.createElement('style');
    style.innerHTML = `
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
    `;
    iframe.contentWindow.document.head.appendChild(style);
  }
}

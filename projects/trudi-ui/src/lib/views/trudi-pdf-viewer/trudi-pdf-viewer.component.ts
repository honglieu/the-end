import { HttpBackend, HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { catchError, map, throwError } from 'rxjs';

@Component({
  selector: 'trudi-pdf-viewer',
  templateUrl: './trudi-pdf-viewer.component.html',
  styleUrls: ['./trudi-pdf-viewer.component.scss']
})
export class TrudiPdfViewerComponent implements OnChanges, AfterViewInit {
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  @Input() pdfUrl: string;
  @Input() showSpinner: boolean;
  @Input() download: boolean;
  @Input() openFile: boolean;
  @Input() viewBookmark: boolean;
  @Input() options: Partial<PdfJsViewerComponent>;
  @ViewChild('pdfViewer') pdfViewer: PdfJsViewerComponent;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pdfUrl']) {
      this.loadPdf(changes['pdfUrl']?.currentValue);
    }
  }
  hasFileError: boolean = false;
  private loadPdf(url: string) {
    this.downloadFile(url).subscribe((res) => {
      if (this.pdfViewer && res) {
        this.pdfViewer.pdfSrc = res;
        this.pdfViewer.refresh();
        this.hasFileError = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.options) {
      for (const key of Object.keys(this.options)) {
        this.setOptions(key, this.options[key]);
      }
    }
  }

  private setOptions(optionKey: string, value: unknown) {
    if (this.pdfViewer) {
      this.pdfViewer[optionKey] = value;
    }
  }

  private downloadFile(url: string) {
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map((result) => {
        return result;
      }),
      catchError((err) => {
        this.hasFileError = true;
        return throwError(
          () => new Error('Something bad happened; please try again')
        );
      })
    );
  }
}

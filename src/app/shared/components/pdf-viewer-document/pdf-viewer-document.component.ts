import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { EMediaZoomType } from '@shared/components/zoomable-media/zoomable-media.types';

@Component({
  selector: 'pdf-viewer-document',
  templateUrl: './pdf-viewer-document.component.html',
  styleUrls: ['./pdf-viewer-document.component.scss']
})
export class PdfViewerDocumentComponent implements OnInit {
  @Input() mediaLink: string;
  public dataLoaded = false;
  public totalPage = 1;
  public page = 1;
  public source = {};
  @Input() maxScale = 500;
  @Input() minScale = 25;
  @Input() stepPerScroll = 5;
  @Input() stepPerPlusOrMinus = 25;
  @ViewChild('zoomContainer') zoomContainer!: ElementRef<HTMLDivElement>;
  initialZoomTargetSize = {
    width: 0,
    height: 0
  };
  scale = 100;
  rotate = 0;
  isExpandWidth = true;

  constructor(private _elementRef: ElementRef) {}

  @HostListener('wheel', ['$event'])
  handleScroll(event: WheelEvent) {
    if (event.ctrlKey) {
      this.scrolled(event);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleScaleByKeyboard(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === '+') {
        event.preventDefault();
        this.handleZoom(EMediaZoomType.PLUS);
      } else if (event.key === '-') {
        event.preventDefault();
        this.handleZoom(EMediaZoomType.MINUS);
      }
    }
  }

  ngOnInit(): void {
    this.source = {
      url: `${this.mediaLink}?version=1.0}`,
      httpHeaders: { cache: 'no-cache' }
    };
  }
  handleZoom(ZoomType: EMediaZoomType) {
    switch (ZoomType) {
      case EMediaZoomType.PLUS:
        this.updateScale(this.scale + this.stepPerPlusOrMinus);
        break;
      case EMediaZoomType.MINUS:
        this.updateScale(this.scale - this.stepPerPlusOrMinus);
        break;
      case EMediaZoomType.EXPAND:
        this.handleExpandImg();
        break;
    }
  }

  handleExpandImg() {
    const container = this.zoomContainer.nativeElement;
    const zoomTarget = this.initialZoomTargetSize;
    let scale = this.scale;
    let targetWidth = 0;
    let targetHeight = 0;
    if (this.rotate % 180 === 0) {
      targetWidth = zoomTarget.width;
      targetHeight = zoomTarget.height;
    } else {
      targetWidth = zoomTarget.height;
      targetHeight = zoomTarget.width;
    }
    if (this.isExpandWidth) {
      scale = Math.ceil((container.offsetWidth / targetWidth) * 100);
    } else {
      scale = Math.ceil((container.offsetHeight / targetHeight) * 100);
    }
    this.isExpandWidth = !this.isExpandWidth;
    this.updateScale(scale);
  }
  protected readonly EMediaZoomType = EMediaZoomType;

  private scrolled(event: WheelEvent) {
    event.preventDefault();
    let delta = -Math.sign(event.deltaY);
    const scale = this.scale + delta * this.stepPerScroll;
    this.updateScale(scale);
  }
  loadCompleted(event) {
    this.dataLoaded = true;
    this.totalPage = event.numPages;
  }

  get scaleValue() {
    return Math.max(this.minScale, Math.min(this.maxScale, this.scale)) / 100;
  }

  handleRotate() {
    this.rotate += 90;
    this.handlePageRendered();
  }

  updateScale(event: number | Event) {
    if (event === this.scale) {
      return;
    }
    let scale = 0;
    if (typeof event !== 'number') {
      scale = (event.target as HTMLInputElement).valueAsNumber;
    } else {
      scale = event;
    }
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
  }

  handlePageRendered() {
    const zoomTarget = document.querySelector('.pdfViewer .page');
    this.initialZoomTargetSize = {
      width: zoomTarget.clientWidth / (this.scale / 100),
      height: zoomTarget.clientHeight / (this.scale / 100)
    };
  }
}

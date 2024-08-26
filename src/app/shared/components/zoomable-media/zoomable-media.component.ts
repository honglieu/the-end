import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  ViewChild
} from '@angular/core';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { EMediaZoomType } from './zoomable-media.types';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { ScalePercentInputComponent } from './scale-percent-input/scale-percent-input.component';
import { TrudiUiModule } from '@trudi-ui';

@Component({
  selector: 'zoomable-media',
  standalone: true,
  imports: [
    NgIf,
    NzMenuItemComponent,
    AsyncPipe,
    CustomPipesModule,
    NzTooltipDirective,
    FormsModule,
    NgClass,
    ScalePercentInputComponent,
    TrudiUiModule
  ],
  templateUrl: './zoomable-media.component.html',
  styleUrl: './zoomable-media.component.scss'
})
export class ZoomableMediaComponent {
  @Input() maxScale = 500;
  @Input() minScale = 25;
  @Input() stepPerScroll = 5;
  @Input() stepPerPlusOrMinus = 25;
  @ViewChild('zoomContainer') zoomContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomTarget') zoomTarget!: ElementRef<HTMLDivElement>;
  scale = 100;
  rotate = 0;
  isExpandWidth = true;

  @ViewChild('zoomTarget', { static: true })
  target!: ElementRef<HTMLDivElement>;
  canDrag: boolean = false;
  targetTranslation = { x: 0, y: 0 };

  private _previousMouseOffset = {
    x: 0,
    y: 0
  };

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
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

  constructor(
    private _elementRef: ElementRef,
    private _renderer: Renderer2,
    private _cdr: ChangeDetectorRef
  ) {}

  private scrolled(event: WheelEvent) {
    event.preventDefault();
    let delta = -Math.sign(event.deltaY);
    const scale = this.scale + delta * this.stepPerScroll;
    this.updateScale(scale);
  }

  handleExpandImg() {
    const container = this._elementRef.nativeElement;
    const zoomTarget = this.zoomTarget.nativeElement;
    let scale = this.scale;
    let containerWidth = 0;
    let containerHeight = 0;
    if (this.rotate % 180 === 0) {
      containerWidth = container.offsetWidth;
      containerHeight = container.offsetHeight;
    } else {
      containerWidth = container.offsetHeight;
      containerHeight = container.offsetWidth;
    }
    if (this.isExpandWidth) {
      scale = Math.ceil((containerWidth / zoomTarget.offsetWidth) * 100);
    } else {
      scale = Math.ceil((containerHeight / zoomTarget.offsetHeight) * 100);
    }
    this.isExpandWidth = !this.isExpandWidth;
    this.updateScale(scale);
  }

  handleZoom(zoomType: EMediaZoomType) {
    switch (zoomType) {
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

  protected readonly EMediaZoomType = EMediaZoomType;

  get scaleValue() {
    return Math.max(this.minScale, Math.min(this.maxScale, this.scale)) / 100;
  }

  handleRotate() {
    this.rotate += 90;
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

    const zoomTargetOffset = this.zoomTarget.nativeElement;
    const elementRef = this._elementRef.nativeElement;

    const scaledWidth = (zoomTargetOffset.offsetWidth * this.scale) / 100;
    const scaledHeight = (zoomTargetOffset.offsetHeight * this.scale) / 100;

    const { overX, overY } = this._overTargetSize;
    if (overX - Math.abs(this.targetTranslation.x) < 0) {
      this.targetTranslation.x = 0;
      this.canDrag = false;
    }

    if (overY - Math.abs(this.targetTranslation.y) < 0) {
      this.targetTranslation.y = 0;
      this.canDrag = false;
    }
    if (
      scaledWidth > elementRef.offsetWidth ||
      scaledHeight > elementRef.offsetHeight
    ) {
      this.canDrag = true;
    }

    this._cdr.markForCheck();
  }

  onDragStart(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const target = this.target.nativeElement;
    target.style.cursor = 'move';

    this._previousMouseOffset = {
      x: event.pageX,
      y: event.pageY
    };
    const destroyMouseMove = this._renderer.listen(
      this.zoomTarget.nativeElement,
      'mousemove',
      this.onDragMove.bind(this)
    );
    const endDragEvents = ['mouseup', 'mouseleave', 'mouseout'];
    let removeEvent: (() => void)[] = [
      destroyMouseMove,
      () => {
        target.style.cursor = 'default';
      }
    ];
    endDragEvents.forEach((eventName) => {
      const mouseupEvent = this._renderer.listen(
        this.zoomTarget.nativeElement,
        eventName,
        () => {
          removeEvent.forEach((remove) => remove());
          removeEvent = [];
        }
      );
      removeEvent.push(mouseupEvent);
    });
  }

  onDragMove(event: MouseEvent) {
    if (!this.canDrag) return;
    const currentMousePosition = { x: event.pageX, y: event.pageY };
    const changeX = currentMousePosition.x - this._previousMouseOffset.x;
    const changeY = currentMousePosition.y - this._previousMouseOffset.y;

    const { overX, overY } = this._overTargetSize;
    if (overY < 0) {
      this.targetTranslation.y = 0;
    } else if (overY - Math.abs(this.targetTranslation.y + changeY) > 0) {
      this.targetTranslation.y += changeY;
    }
    if (overX < 0) {
      this.targetTranslation.x = 0;
    } else if (overX - Math.abs(this.targetTranslation.x + changeX) > 0) {
      this.targetTranslation.x += changeX;
    }
    this._previousMouseOffset = currentMousePosition;
  }

  private get _overTargetSize() {
    let width = 0;
    let height = 0;
    if (this.rotate % 180 === 0) {
      width = this.zoomTarget.nativeElement.clientWidth;
      height = this.zoomTarget.nativeElement.clientHeight;
    } else {
      width = this.zoomTarget.nativeElement.clientHeight;
      height = this.zoomTarget.nativeElement.clientWidth;
    }
    const overY = (height * (this.scale / 100) - window.innerHeight) / 2;
    const overX = (width * (this.scale / 100) - window.innerWidth) / 2;
    return {
      overX,
      overY
    };
  }
}

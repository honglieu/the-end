import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import Swiper, { SwiperOptions } from 'swiper';
import SwiperCore, { Mousewheel, Pagination } from 'swiper';
import {
  IPosittion,
  IPromotion
} from '@/app/console-setting/promotions/utils/promotions.interface';

SwiperCore.use([Mousewheel, Pagination]);

@Component({
  selector: 'promotions-modal',
  templateUrl: './promotions-modal.component.html',
  styleUrls: ['./promotions-modal.component.scss']
})
export class PromotionsModalComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperContainer') swiperContainer: ElementRef;
  @Input() isShowPromotionsModal: boolean = false;
  @Input() position: IPosittion = {
    top: '',
    left: '',
    right: '',
    bottom: ''
  };
  @Input() promotionsData: IPromotion;

  @Output() closePromotionModal = new EventEmitter();

  public swiperConfig: SwiperOptions = {
    navigation: false,
    spaceBetween: 24,
    mousewheel: true,
    allowTouchMove: false
  };

  public currentPage: number = 0;
  public swiper;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.swiper = new Swiper(
      this.swiperContainer?.['elementRef'].nativeElement,
      this.swiperConfig
    );

    this.swiper.on('slideChange', (e) => {
      const swiper = document.getElementById('swiper');
      this.currentPage = e.activeIndex;
      swiper.click();
      this.cdr.markForCheck();
    });

    const allContentElements = document.querySelectorAll('.wrap-content');

    if (allContentElements.length) {
      const highestHeight = Array.from(allContentElements)
        .map((el) => {
          return el.getBoundingClientRect().height;
        })
        .sort((a, b) => b - a)[0];
      allContentElements.forEach((el) => {
        el.setAttribute('style', `height: ${highestHeight}px`);
      });
    }
  }

  ngOnInit(): void {}

  previousPage() {
    this.swiper.slidePrev();
  }

  nextPage() {
    this.swiper.slideNext();
  }

  closeModal() {
    this.closePromotionModal.emit(false);
  }
}

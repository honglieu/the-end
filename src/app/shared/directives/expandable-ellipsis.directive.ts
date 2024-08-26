import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2
} from '@angular/core';

@Directive({ selector: '[expandableEllipsis]', standalone: true })
export class ExpandableEllipsisDirective implements OnInit, AfterViewInit {
  @Input() parentSelector: string = '';
  @Input() maxLine = 1;
  public isExpanded = false;
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer2: Renderer2
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.isExpanded = false;
    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      'display',
      '-webkit-box'
    );
    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      '-webkit-box-orient',
      'vertical'
    );

    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      'white-space',
      'initial'
    );
    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      'overflow',
      'hidden'
    );
    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      '-webkit-line-clamp',
      this.maxLine
    );
    this.renderer2.setStyle(
      this.elementRef.nativeElement,
      'overflow-wrap',
      'break-word'
    );
  }

  @HostListener('click', ['$event'])
  handleClick(event: Event) {
    if (this.isExpanded) {
      this.renderer2.setStyle(
        this.elementRef.nativeElement,
        '-webkit-line-clamp',
        this.maxLine
      );
      this.isExpanded = false;
    } else {
      this.renderer2.setStyle(
        this.elementRef.nativeElement,
        '-webkit-line-clamp',
        'initial'
      );
      this.isExpanded = true;
    }
  }
}

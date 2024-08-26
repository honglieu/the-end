import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'outline-rounded-button',
  templateUrl: './outline-rounded-button.component.html',
  styleUrls: ['./outline-rounded-button.component.scss']
})
export class OutlineRoundedButtonComponent implements OnInit, OnChanges {
  @Input() variant = '#00AA9F';
  @Input() borderColor = this.variant;
  @Input() textColor = this.variant;
  @Input() backgroundColor = '#FFFFFF';
  @Input() text = '';
  @Input() textMargin = '0';
  constructor(private readonly elr: ElementRef<HTMLElement>) {}

  ngOnChanges() {
    this.borderColor = this.variant;
    this.textColor = this.variant;
    const elm = this.elr.nativeElement;
    elm.style.backgroundColor = this.backgroundColor;
    elm.style.borderColor = this.borderColor;
  }

  ngOnInit(): void {}
}

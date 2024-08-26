import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'trudi-document-item',
  templateUrl: './trudi-document-item.component.html',
  styleUrls: ['./trudi-document-item.component.scss']
})
export class DocumentItemComponent implements OnInit {
  @ViewChild('widgetItem') widgetItem: ElementRef;

  @Input() title: string;

  @Input() subtitle: string;

  @Input() fileType: string;

  @Input() isSync: boolean;

  @Input() thumbnail: string;

  @Output() onClick = new EventEmitter<MouseEvent>();

  @Output() onSend = new EventEmitter<MouseEvent>();

  @Output() onDownload = new EventEmitter<MouseEvent>();

  @Output() onSync = new EventEmitter<MouseEvent>();

  public isWidgetFocused: boolean = false;

  public isShowCarousel: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  handleClickIconThreeDot(event: MouseEvent) {
    event.stopPropagation();
  }

  handleMenuVisibleChange(event: boolean) {
    this.isWidgetFocused = event;
  }
}

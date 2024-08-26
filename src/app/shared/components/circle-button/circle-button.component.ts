import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Button } from '@shared/types/share.model';
import { TrudiButton } from '@shared/types/trudi.interface';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';

@Component({
  selector: 'circle-button',
  templateUrl: './circle-button.component.html',
  styleUrls: ['./circle-button.component.scss']
})
export class CircleButtonComponent implements OnInit, OnChanges {
  @Input() button: TrudiButton;
  @Input() size: number;
  @Input() sizeimg: number;
  @Input() action: string;
  @Input() nextStep: number;
  @Output() onClick = new EventEmitter<TrudiButton>();

  public srcImg: string;
  public hintImg: string;

  private editButton: Button = {
    hint: 'Edit Message',
    pathUrl: '/assets/icon/icon-edit-tab.svg',
    data_e2e: 'message-edit-btn'
  };
  private sendButton: Button = {
    hint: 'Send Message',
    pathUrl: '/assets/icon/icon-send.svg',
    data_e2e: 'message-send-btn'
  };

  constructor() {}

  ngOnInit(): void {
    this.getSrcImg(this.button);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['button']?.currentValue) {
      this.getSrcImg(this.button);
    }
  }

  getSrcImg(button: TrudiButton) {
    switch (button.action) {
      case ForwardButtonAction.editMessage:
        this.srcImg = this.editButton.pathUrl;
        this.hintImg = this.editButton.data_e2e;
        break;
      case ForwardButtonAction.sendMessage:
        this.srcImg = this.sendButton.pathUrl;
        this.hintImg = this.sendButton.data_e2e;
        break;
      default:
        this.srcImg = this.editButton.pathUrl;
        this.hintImg = this.editButton.data_e2e;
        break;
    }
  }
}

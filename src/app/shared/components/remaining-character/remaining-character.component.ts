import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';

@Component({
  selector: 'app-remaining-character',
  templateUrl: './remaining-character.component.html',
  styleUrls: ['./remaining-character.component.scss']
})
export class RemainingCharacterComponent implements OnInit {
  @Input() maxlength: number = 0;
  @Input() currentTextLength: number = 0;
  @Input() isShowNegative: boolean = false;
  @Input() showCurrentTextLength: boolean = false;
  @Input() countCharacterUp: boolean = true;

  public remainingText: number = 0;
  constructor(private trudiSendMsgFormService: TrudiSendMsgFormService) {}

  ngOnInit() {}

  ngOnChanges(): void {
    const remainingCharacters = this.maxlength - this.currentTextLength;
    this.remainingText = Math.max(remainingCharacters, 0);
    const msgContentControl =
      this.trudiSendMsgFormService.sendMsgForm?.get('msgContent');
    msgContentControl?.addValidators(this.checkMaxLength());
    this.trudiSendMsgFormService.sendMsgForm?.updateValueAndValidity();
  }

  checkMaxLength() {
    return (control: AbstractControl) => {
      if (this.currentTextLength > this.maxlength) {
        return {
          maxlength: {
            requiredLength: this.maxlength,
            actualLength: this.currentTextLength
          }
        };
      }
      return null;
    };
  }
}

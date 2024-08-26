import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatGptService, generateGptBody } from '@services/chatGpt.service';
import { trudiUserId } from '@services/constants';
import {
  CheckBoxImgPath,
  EActionShowMessageTooltip
} from '@shared/enum/share.enum';

export enum SETTING_EVENT {
  BACK = 'BACK',
  CANCEL = 'CANCEL',
  SAVE = 'SAVE'
}

@Component({
  selector: 'ai-setting-control',
  templateUrl: './ai-setting-control.component.html',
  styleUrls: ['./ai-setting-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiSettingControlComponent implements OnInit, OnDestroy {
  @Output() settingTrigger = new EventEmitter<SETTING_EVENT>();
  private destroy$ = new Subject<void>();
  form: FormGroup;

  public check = CheckBoxImgPath.radioChecked;
  public uncheck = CheckBoxImgPath.radioUncheck;
  public actionShowMessageTooltip = EActionShowMessageTooltip;
  public SETTING_EVENT = SETTING_EVENT;

  constructor(private fb: FormBuilder, private chatGptService: ChatGptService) {
    this.form = this.fb.group({
      toneOfVoice: ['Professional'],
      replyAs: ['Me']
    });
  }

  ngOnInit(): void {
    this.chatGptService.generateBody
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: generateGptBody) => {
        this.form.setValue({
          toneOfVoice: data.toneOfVoice,
          replyAs: data.currentUserId === trudiUserId ? 'Trudi' : 'Me'
        });
      });
  }

  onSubmit() {
    this.chatGptService.generateBody.next({
      ...this.chatGptService.generateBody.value,
      toneOfVoice: this.getToneOfVoice,
      currentUserId:
        this.getReplyAs === 'Trudi'
          ? trudiUserId
          : localStorage.getItem('userId')
    });
    this.chatGptService.showPopover$.next(false);
    this.settingTrigger.emit(SETTING_EVENT.SAVE);
  }

  get getToneOfVoice() {
    return this.form?.get('toneOfVoice')?.value;
  }

  get getReplyAs() {
    return this.form?.get('replyAs')?.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

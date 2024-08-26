import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import { TrudiSingleSelectComponent } from '@trudi-ui';
import { Conversation } from '@/app/task-detail/modules/app-chat/components/ai-summary/models';

@Component({
  selector: 'select-conversations',
  templateUrl: './select-conversations.component.html',
  styleUrls: ['./select-conversations.component.scss']
})
export class SelectConversationsComponent implements OnDestroy {
  @ViewChild(TrudiSingleSelectComponent)
  selectComponent!: TrudiSingleSelectComponent;
  @Output() valueChange = new EventEmitter<Conversation>();
  @Input() conversations: Conversation[];

  private _conversationId: string;
  @Input()
  set conversationId(value: string) {
    this._conversationId = value;
    this._setConversation(value);
  }

  get conversationId() {
    return this._conversationId;
  }

  private _disbaled: boolean;
  @Input()
  set disabled(value: boolean) {
    this._disbaled = value;
    if (value) {
      this._control.disable();
    } else {
      this._control.enable();
    }
  }

  get disabled() {
    return this._disbaled;
  }

  private readonly _destroy$ = new Subject<void>();
  private get _control() {
    return this.form.get('conversation');
  }
  public form = new FormGroup({
    conversation: new FormControl(null)
  });

  public userPropertyType = EUserPropertyType;
  public isRmEnvironment = true;
  public pipeType: string = userType.DEFAULT;

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public handleSelectConversation(conversation: Conversation) {
    this.selectComponent?.select?.close();
    if (conversation.id != this.conversationId) {
      this.valueChange.emit(conversation);
    }
  }

  private _setConversation(conversationId: string) {
    this._control.setValue(conversationId, {
      onlySelf: true,
      emitEvent: false
    });
  }
}

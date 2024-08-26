import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConversationService } from '@services/conversation.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskItem } from '@shared/types/task.interface';
import { isSupplierOrOtherOrExternal } from '@/app/user/utils/user.type';

@Component({
  selector: 'group-item',
  templateUrl: './group-item.component.html',
  styleUrls: ['./group-item.component.scss']
})
export class GroupItemComponent implements OnInit {
  @Input() items: TaskItem[];
  @Input() groupName: string;
  @Input() search = '';
  @Input() selectedId = '';
  @Input() isShowAddress: boolean = false;
  isSupplierOrOtherOrExternal = false;
  private subscribers = new Subject<void>();

  @Output() onClick = new EventEmitter<TaskItem>();
  constructor(private conversationService: ConversationService) {}

  ngOnInit(): void {
    this.conversationService.currentConversation
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.isSupplierOrOtherOrExternal = isSupplierOrOtherOrExternal(
            res?.propertyType
          );
        }
      });
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }
}

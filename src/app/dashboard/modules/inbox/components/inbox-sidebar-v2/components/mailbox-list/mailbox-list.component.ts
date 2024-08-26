import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { EMailBoxStatus } from '@shared/enum';
import { IMailBox } from '@shared/types/user.interface';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'mailbox-list',
  templateUrl: './mailbox-list.component.html',
  styleUrl: './mailbox-list.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class MailboxListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() listMailBoxs: IMailBox[] = [];
  @Input() unreadList: { [x: string]: boolean } = {};

  @ViewChild(CdkDropList) dropList: CdkDropList;
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;

  private unsubscribe = new Subject<void>();
  public mailboxActive: Set<string> = new Set();

  constructor(
    private mailboxSettingService: MailboxSettingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['listMailBoxs'] &&
      changes['listMailBoxs'].previousValue !==
        changes['listMailBoxs'].currentValue
    ) {
      this.listMailBoxs = this.listMailBoxs.filter(
        (item) => item.status !== EMailBoxStatus.ARCHIVE
      );
      this.mailboxActive = new Set();

      this.listMailBoxs?.forEach((mailbox) => {
        const mailboxActiveString = localStorage.getItem('mailboxActive');
        if (mailboxActiveString) {
          const mailboxActiveArray = JSON.parse(mailboxActiveString);
          this.mailboxActive = new Set(mailboxActiveArray);
        }
        if (this.mailboxActive.has(mailbox.id)) {
          mailbox.isOpen = true;
        }
      });
    }
  }

  beforeUnloadHandler() {
    localStorage.removeItem('mailboxActive');
  }

  handleSelectMailboxActive(item) {
    this.mailboxActive.add(item);
  }

  handleExpandMailbox(mailbox) {
    const mailboxSelected = this.listMailBoxs?.find(
      (item) => item?.id === mailbox?.id
    );
    if (mailboxSelected) {
      mailboxSelected.isOpen = !mailboxSelected.isOpen;

      if (mailboxSelected.isOpen) {
        this.mailboxActive.add(mailbox?.id);
      } else {
        this.mailboxActive.delete(mailbox?.id);
      }

      localStorage.setItem(
        'mailboxActive',
        JSON.stringify(Array.from(this.mailboxActive))
      );
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    this.mailboxSettingService.handleDropMailBoxItem(event, this.listMailBoxs);
  }

  handleStartDrag() {
    const hasOpen = this.listMailBoxs.some((item) => item.isOpen);
    if (!hasOpen) return;
    this.listMailBoxs = this.listMailBoxs.map((item) => ({
      ...item,
      isOpen: false
    }));
    this.cdr.detectChanges();
    this.dropList._dropListRef.withItems(
      this.dragItems.map((drag) => drag._dragRef)
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }
}

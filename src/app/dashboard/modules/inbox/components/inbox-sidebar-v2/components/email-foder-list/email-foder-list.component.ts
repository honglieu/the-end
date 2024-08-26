import { IMailBox } from '@shared/types/user.interface';
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
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Subject } from 'rxjs';
import { EMailBoxStatus, EmailProvider } from '@shared/enum';
import {
  EFolderType,
  ITaskFolderRoute
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { Params } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';

@Component({
  selector: 'email-foder-list',
  templateUrl: './email-foder-list.component.html',
  styleUrl: './email-foder-list.component.scss'
})
export class EmailFoderListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() listMailBoxs: IMailBox[] = [];

  @ViewChild(CdkDropList) dropList: CdkDropList;
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;

  public paragraph;
  private unsubscribe = new Subject<void>();
  public emailFolder: ITaskFolderRoute = {
    name: '',
    type: EFolderType.GMAIL,
    isOpen: false,
    icon: '',
    children: []
  };
  public listMailBoxSidebar: ITaskFolderRoute[] = [];
  public currentQueryParams: Params;

  constructor(
    public inboxService: InboxService,
    public folderService: FolderService,
    private mailboxSettingService: MailboxSettingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listMailBoxs']) {
      this.listMailBoxs = this.listMailBoxs.filter(
        (item) =>
          item.status !== EMailBoxStatus.ARCHIVE &&
          item.status !== EMailBoxStatus.DISCONNECT
      );
      this.listMailBoxSidebar = this.listMailBoxs.map((item) => {
        let isOpen = false;
        if (this.inboxService.mailboxIdEmailActive.has(item.id)) {
          isOpen = true;
        }
        return {
          ...this.emailFolder,
          mailBoxName: item.name,
          order: item.order,
          isOpen: isOpen,
          id: item.id,
          name: item.emailAddress,
          icon: this.getMailboxIcon(item.provider)
        };
      });
    }
  }

  getMailboxIcon(provider: string) {
    switch (provider) {
      case EmailProvider.OUTLOOK:
        return 'outlookIcon';
      case EmailProvider.GMAIL:
        return 'gmailIcon';
      default:
        return 'icloudIcon';
    }
  }

  handleSelectMailBox(mailBox, item) {
    const mailBoxId = this.inboxService.refreshEmailFolderMailBoxValue?.id;
    if (item.isOpen && mailBoxId !== mailBox.id) {
      // fresh list email folder by mailbox
      this.inboxService.setRefreshEmailFolderMailBox(mailBox);
    }
    this.inboxService.mailboxIdEmailActive.add(mailBox.id);
    const mailboxSelected = this.listMailBoxSidebar?.find(
      (item) => item?.id === mailBox?.id
    );
    if (mailboxSelected) {
      if (mailboxSelected.isOpen) {
        this.inboxService.mailboxIdEmailActive.add(mailBox?.id);
      } else {
        this.inboxService.mailboxIdEmailActive.delete(mailBox?.id);
      }
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    this.mailboxSettingService.handleDropMailBoxItem(event, this.listMailBoxs);
  }

  handleStartDrag() {
    const hasOpen = this.listMailBoxSidebar.some((item) => item.isOpen);
    if (!hasOpen) return;
    this.listMailBoxSidebar = this.listMailBoxSidebar.map((item) => ({
      ...item,
      isOpen: false
    }));
    this.dropList._dropListRef.withItems(
      this.dragItems.map((drag) => drag._dragRef)
    );
    this.cdr.detectChanges();
    this.inboxService.mailboxIdEmailActive.clear();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

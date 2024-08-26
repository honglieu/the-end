import { EConfirmContactType } from '@shared/enum';
import { Component, Input, OnInit } from '@angular/core';
import { EPage } from '@shared/enum/trudi';

@Component({
  selector: 'app-message-deleted',
  templateUrl: './message-deleted.component.html',
  styleUrls: ['./message-deleted.component.scss']
})
export class MessageDeletedComponent implements OnInit {
  @Input() message;
  public title: string = '';
  public isFromMailBox: boolean = false;
  public EPage = EPage;
  constructor() {}

  ngOnInit(): void {
    this.title = this.message?.title;
    this.isFromMailBox =
      this.message?.userType === EConfirmContactType.MAILBOX && !!this.title;
  }
}

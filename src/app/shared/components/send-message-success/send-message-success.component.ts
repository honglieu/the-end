import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-send-message-success',
  templateUrl: './send-message-success.component.html',
  styleUrls: ['./send-message-success.component.scss']
})
export class SendMessageSuccessComponent implements OnInit, OnChanges {
  @Input() ticket: any;
  @Input() listReceiver = [];
  @Input() numberSent: number;
  @Input() icon: string = 'icon-success';
  public title: string;
  constructor(private userService: UserService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listReceiver'] || changes['ticket']) {
      this.getTitle();
    }
  }

  getTitle() {
    const listTitle = this.userService.countUserByType(this.listReceiver);
    const title = [];
    for (let [key, value] of Object.entries(listTitle)) {
      if (value > 1) {
        key = key + 's';
      }
      if (title.length > 1 && value > 0) {
        title.push(` & ${value} ${key}`);
      } else if (title.length > 0 && value > 0) {
        title.push(`, ${value} ${key}`);
      } else if (value) {
        title.push(`${value} ${key}`);
      }
    }
    this.title = title.join('');
  }
}

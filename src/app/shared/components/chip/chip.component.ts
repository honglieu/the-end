import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  HostListener
} from '@angular/core';

@Component({
  selector: 'chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss']
})
export class ChipComponent implements OnInit {
  @Input() title: string;
  @Input() height: string;
  @Input() isActive: boolean = false;
  @Input() styles: string = '';
  @Input() titleStyles: string = '';
  @Input() data: any;
  @Input() preventDefault: boolean = false;
  @Output() onClick = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  handleClick(data: any): void {
    this.onClick.emit(data);
    if (!this.preventDefault) {
      this.isActive = !this.isActive;
    }
  }
}

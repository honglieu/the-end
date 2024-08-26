import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'group-color-picker',
  templateUrl: './group-color-picker.component.html',
  styleUrls: ['./group-color-picker.component.scss']
})
export class GroupColorPickerComponent implements OnInit {
  @Input() currentColor: string;
  @Input() showDropdown = false;
  @Output() selectColorCode = new EventEmitter<string>();
  constructor() {}
  public readonly COLORS = [
    '#F03838',
    '#FF7F37',
    '#DC51F3',
    '#CAC329',
    '#4A7CE0',
    '#00968D',
    '#378FCE',
    '#7B67F7',
    '#74737E',
    '#B47E57'
  ];

  ngOnInit(): void {}

  public handleSelectColor(colorCode: string) {
    this.selectColorCode.emit(colorCode);
  }

  public changeDropdown(event) {
    this.showDropdown = event;
  }
}

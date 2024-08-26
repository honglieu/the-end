import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'favourite-star',
  templateUrl: './favourite-star.component.html',
  styleUrls: ['./favourite-star.component.scss']
})
export class FavouriteStarComponent implements OnInit {
  @Input() isActive: boolean;
  @Output() onUpdateFavourite = new EventEmitter<boolean>();
  constructor() {}

  ngOnInit(): void {}

  handleToggleSelectFavourite(value: boolean): void {
    this.isActive = value;
    this.onUpdateFavourite.emit(value);
  }
}

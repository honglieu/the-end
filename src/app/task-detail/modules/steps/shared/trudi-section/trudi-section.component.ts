import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'trudi-section',
  templateUrl: './trudi-section.component.html',
  styleUrls: ['./trudi-section.component.scss'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'trudi-section'
  }
})
export class TrudiSectionComponent implements OnInit {
  @Input() groupTitle: string = null;

  constructor() {}

  ngOnInit(): void {}
}

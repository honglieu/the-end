import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'trudi-suggested-step-group',
  templateUrl: './trudi-suggested-step-group.component.html',
  styleUrls: ['./trudi-suggested-step-group.component.scss'],
  host: {
    class: 'trudi-suggested-step-group'
  }
})
export class TrudiSuggestedStepGroupComponent implements OnInit {
  @Input() groupTitle: string = null;

  constructor() {}

  ngOnInit(): void {}
}

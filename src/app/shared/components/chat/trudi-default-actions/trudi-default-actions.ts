import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-trudi-default-actions',
  templateUrl: 'trudi-default-actions.html',
  styleUrls: ['./trudi-default-actions.scss']
})
export class TrudiDefaultActionsComponent {
  @Input() userMessage;

  constructor() {}
}

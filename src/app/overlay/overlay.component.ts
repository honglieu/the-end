import { Component } from '@angular/core';
import { OverlayData } from './overlay.config';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent {
  constructor(readonly data: OverlayData) {}
}

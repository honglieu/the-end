import { Component, Input } from '@angular/core';

@Component({
  selector: 'sections-container',
  templateUrl: './sections-container.component.html',
  styleUrls: ['./sections-container.component.scss']
})
export class SectionsContainerComponent {
  @Input() titleInput: string;
  @Input() subTitle: string;
}

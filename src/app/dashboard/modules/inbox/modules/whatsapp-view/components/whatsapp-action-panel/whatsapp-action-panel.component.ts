import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'whatsapp-action-panel',
  templateUrl: './whatsapp-action-panel.component.html',
  styleUrl: './whatsapp-action-panel.component.scss',
  animations: [
    trigger('collapseModal', [
      state(
        'collapsed',
        style({
          height: 36,
          width: 238
        })
      ),
      state('expanded', style({ height: '*', maxHeight: '40vh' })),
      transition('collapsed => expanded', animate('0.25s ease-in-out')),
      transition('expanded => collapsed', animate('0.25s ease-in-out'))
    ])
  ]
})
export class WhatsappActionPanelComponent {
  isExpanded: boolean = false;
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { E2eAttributeDirective } from './e2eAttribute.directive';
import { CloseDropdownWhenResizableDirective } from '@shared/directives/close-dropdown-when-resizable.directive';
import { MenuKeyboardDirective } from './menuKeyboard.directive';
import { DisableOpenSendMsgModalDirective } from './disable-open-send-msg-modal.directive';
import { E2EDragDropDirective } from './e2eDragDrop.directive';
import { FocusElementDirective } from './focus-element.directive';
import { DisableTooltipOnWidthDirective } from './disable-tooltip-on-width.directive';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive';
import { TriggerLongContentTooltipDirective } from './trigger-long-content-tooltip.directive';

@NgModule({
  declarations: [
    E2eAttributeDirective,
    CloseDropdownWhenResizableDirective,
    MenuKeyboardDirective,
    DisableOpenSendMsgModalDirective,
    E2EDragDropDirective,
    FocusElementDirective,
    DisableTooltipOnWidthDirective,
    ClickStopPropagationDirective,
    TriggerLongContentTooltipDirective
  ],
  imports: [CommonModule],
  exports: [
    E2eAttributeDirective,
    CloseDropdownWhenResizableDirective,
    MenuKeyboardDirective,
    DisableOpenSendMsgModalDirective,
    E2EDragDropDirective,
    FocusElementDirective,
    DisableTooltipOnWidthDirective,
    ClickStopPropagationDirective,
    TriggerLongContentTooltipDirective
  ]
})
export class CustomDirectivesModule {}

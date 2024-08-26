import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
  selector: '[appGoogleplace]',
  providers: [NgModel]
})
export class GoogleplaceDirective {
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  modelValue: any;
  autocomplete: any;
  private _el: HTMLInputElement;
  isLoaded = false;

  constructor(el: ElementRef, private model: NgModel) {
    this._el = el.nativeElement;
    this.modelValue = this.model;
    const input = this._el;
    const options = {
      componentRestrictions: { country: 'aus' }, //  <== Country code name
      types: ['address']
    };

    this.autocomplete = new google.maps.places.Autocomplete(input, options);
    google.maps.event.addListener(this.autocomplete, 'place_changed', () => {
      const place = this.autocomplete.getPlace();

      this.invokeEvent(place);
    });
  }

  invokeEvent(place: Object) {
    this.setAddress.emit(place);
  }
}

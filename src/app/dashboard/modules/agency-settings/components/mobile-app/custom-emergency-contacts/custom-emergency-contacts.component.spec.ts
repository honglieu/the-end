import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEmergencyContactsComponent } from './custom-emergency-contacts.component';

describe('CustomEmergencyContactsComponent', () => {
  let component: CustomEmergencyContactsComponent;
  let fixture: ComponentFixture<CustomEmergencyContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomEmergencyContactsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomEmergencyContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});

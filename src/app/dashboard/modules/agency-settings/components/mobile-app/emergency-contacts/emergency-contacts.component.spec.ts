import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyContactsComponent } from './emergency-contacts.component';

describe('EmergencyContactsComponent', () => {
  let component: EmergencyContactsComponent;
  let fixture: ComponentFixture<EmergencyContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyContactsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});

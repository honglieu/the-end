import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultEmergencyContactsComponent } from './default-emergency-contacts.component';

describe('DefaultEmergencyContactsComponent', () => {
  let component: DefaultEmergencyContactsComponent;
  let fixture: ComponentFixture<DefaultEmergencyContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultEmergencyContactsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultEmergencyContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});

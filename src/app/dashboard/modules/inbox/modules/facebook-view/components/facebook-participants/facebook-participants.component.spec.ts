import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookParticipantsComponent } from './facebook-participants.component';

describe('FacebookParticipantsComponent', () => {
  let component: FacebookParticipantsComponent;
  let fixture: ComponentFixture<FacebookParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookParticipantsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

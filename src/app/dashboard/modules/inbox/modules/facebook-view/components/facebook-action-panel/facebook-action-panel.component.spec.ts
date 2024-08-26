import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookActionPanelComponent } from './facebook-action-panel.component';

describe('FacebookActionPanelComponent', () => {
  let component: FacebookActionPanelComponent;
  let fixture: ComponentFixture<FacebookActionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookActionPanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookActionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

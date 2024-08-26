import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewConnectComponent } from './facebook-connect.component';

describe('FacebookViewConnectComponent', () => {
  let component: FacebookViewConnectComponent;
  let fixture: ComponentFixture<FacebookViewConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewConnectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

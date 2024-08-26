import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewHubComponent } from './facebook-hub.component';

describe('FacebookViewHubComponent', () => {
  let component: FacebookViewHubComponent;
  let fixture: ComponentFixture<FacebookViewHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewHubComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

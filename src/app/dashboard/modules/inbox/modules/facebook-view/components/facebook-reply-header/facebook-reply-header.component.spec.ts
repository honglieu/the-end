import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookReplyHeaderComponent } from './facebook-reply-header.component';

describe('FacebookReplyHeaderComponent', () => {
  let component: FacebookReplyHeaderComponent;
  let fixture: ComponentFixture<FacebookReplyHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookReplyHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookReplyHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

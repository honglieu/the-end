import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailboxItemComponent } from './mailbox-item.component';

describe('MailboxItemComponent', () => {
  let component: MailboxItemComponent;
  let fixture: ComponentFixture<MailboxItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailboxItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MailboxItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

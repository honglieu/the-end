import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailboxListComponent } from './mailbox-list.component';

describe('MailboxListComponent', () => {
  let component: MailboxListComponent;
  let fixture: ComponentFixture<MailboxListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailboxListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MailboxListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

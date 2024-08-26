import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSummaryAttachmentComponent } from './conversation-summary-attachment.component';

describe('ConversationSummaryAttachmentComponent', () => {
  let component: ConversationSummaryAttachmentComponent;
  let fixture: ComponentFixture<ConversationSummaryAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSummaryAttachmentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationSummaryAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

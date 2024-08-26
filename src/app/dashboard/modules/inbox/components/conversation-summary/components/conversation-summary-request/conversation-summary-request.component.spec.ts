import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSummaryRequestComponent } from './conversation-summary-request.component';

describe('ConversationSummaryRequestComponent', () => {
  let component: ConversationSummaryRequestComponent;
  let fixture: ComponentFixture<ConversationSummaryRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSummaryRequestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationSummaryRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

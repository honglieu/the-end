import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSummaryLinkedComponent } from './conversation-summary-linked.component';

describe('ConversationSummaryLinkedComponent', () => {
  let component: ConversationSummaryLinkedComponent;
  let fixture: ComponentFixture<ConversationSummaryLinkedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSummaryLinkedComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationSummaryLinkedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

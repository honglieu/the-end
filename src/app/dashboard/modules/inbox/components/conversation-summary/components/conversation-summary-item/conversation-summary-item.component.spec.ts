import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSummaryItemComponent } from './conversation-summary-item.component';

describe('ConversationSummaryItemComponent', () => {
  let component: ConversationSummaryItemComponent;
  let fixture: ComponentFixture<ConversationSummaryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSummaryItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationSummaryItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

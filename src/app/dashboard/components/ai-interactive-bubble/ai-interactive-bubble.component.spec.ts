import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiInteractiveBubbleComponent } from './ai-interactive-bubble.component';

describe('AiInteractiveBubbleComponent', () => {
  let component: AiInteractiveBubbleComponent;
  let fixture: ComponentFixture<AiInteractiveBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiInteractiveBubbleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AiInteractiveBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

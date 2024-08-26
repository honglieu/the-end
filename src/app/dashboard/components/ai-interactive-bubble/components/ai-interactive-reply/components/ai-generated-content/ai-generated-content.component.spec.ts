import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiGeneratedContentComponent } from './ai-generated-content.component';

describe('AiGeneratedContentComponent', () => {
  let component: AiGeneratedContentComponent;
  let fixture: ComponentFixture<AiGeneratedContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiGeneratedContentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AiGeneratedContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

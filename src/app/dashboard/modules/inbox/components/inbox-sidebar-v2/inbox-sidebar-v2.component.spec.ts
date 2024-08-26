import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxSidebarV2Component } from './inbox-sidebar-v2.component';

describe('InboxSidebarV2Component', () => {
  let component: InboxSidebarV2Component;
  let fixture: ComponentFixture<InboxSidebarV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxSidebarV2Component]
    }).compileComponents();

    fixture = TestBed.createComponent(InboxSidebarV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

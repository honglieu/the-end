import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarItemV2Component } from './sidebar-item-v2.component';

describe('SidebarItemV2Component', () => {
  let component: SidebarItemV2Component;
  let fixture: ComponentFixture<SidebarItemV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarItemV2Component]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarItemV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

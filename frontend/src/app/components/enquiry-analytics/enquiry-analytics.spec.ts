import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquiryAnalytics } from './enquiry-analytics';

describe('EnquiryAnalytics', () => {
  let component: EnquiryAnalytics;
  let fixture: ComponentFixture<EnquiryAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnquiryAnalytics],
    }).compileComponents();

    fixture = TestBed.createComponent(EnquiryAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

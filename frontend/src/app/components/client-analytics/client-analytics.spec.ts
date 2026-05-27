import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAnalytics } from './client-analytics';

describe('ClientAnalytics', () => {
  let component: ClientAnalytics;
  let fixture: ComponentFixture<ClientAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAnalytics],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoilDegradationComponent } from './soil-degradation.component';

describe('SoilDegradationComponent', () => {
  let component: SoilDegradationComponent;
  let fixture: ComponentFixture<SoilDegradationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoilDegradationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoilDegradationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

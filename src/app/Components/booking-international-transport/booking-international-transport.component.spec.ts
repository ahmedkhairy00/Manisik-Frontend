import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingInternationalTransportComponent } from './booking-international-transport.component';

describe('BookingInternationalTransportComponent', () => {
  let component: BookingInternationalTransportComponent;
  let fixture: ComponentFixture<BookingInternationalTransportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingInternationalTransportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingInternationalTransportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

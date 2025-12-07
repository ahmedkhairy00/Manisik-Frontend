import { TestBed } from '@angular/core/testing';

import { BookingInternationalTransportService } from './booking-international-transport.service';

describe('BookingInternationalTransportService', () => {
  let service: BookingInternationalTransportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingInternationalTransportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

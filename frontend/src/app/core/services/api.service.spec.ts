import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should perform GET request with query params', () => {
    service.get<{ data: string[] }>('products', { page: 1, search: 'samsung' }).subscribe((res) => {
      expect(res.data).toEqual(['item1']);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/products?page=1&search=samsung');
    expect(req.request.method).toBe('GET');
    req.flush({ data: ['item1'] });
  });

  it('should perform POST request', () => {
    const payload = { name: 'New Item' };
    service.post<{ id: number }>('products', payload).subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1 });
  });

  it('should perform DELETE request', () => {
    service.delete<{ message: string }>('products/1').subscribe((res) => {
      expect(res.message).toBe('deleted');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/products/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });
});

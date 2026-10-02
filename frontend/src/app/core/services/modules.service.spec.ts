import { TestBed } from '@angular/core/testing';
import { ModulesService } from './modules.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('ModulesService', () => {
  let service: ModulesService;
  let mockApiService: any;

  beforeEach(() => {
    mockApiService = {
      get: vi.fn().mockReturnValue(
        of([
          { id: 1, code: 'DASHBOARD', name: 'Dashboard', route: '/dashboard', order: 1, isActive: true },
          { id: 2, code: 'USERS', name: 'Usuarios', route: '/users', order: 2, isActive: true },
        ]),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        ModulesService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(ModulesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load my modules from API', () => {
    service.loadMyModules();
    expect(mockApiService.get).toHaveBeenCalledWith('modules/me');
    expect(service.modules().length).toBe(2);
    expect(service.modules()[0].code).toBe('DASHBOARD');
  });
});

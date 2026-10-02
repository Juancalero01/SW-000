import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';
import { Role, User } from '../../../core/models/user.model';

export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  lastPage: number;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  roles?: string[];
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  roles?: string[];
  isActive?: boolean;
  isEmailVerified?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly rolesUrl = `${environment.apiUrl}/roles`;

  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleName?: string;
    isActive?: boolean;
  }): Observable<PaginatedUsersResponse> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.roleName) httpParams = httpParams.set('roleName', params.roleName);
    if (params?.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());

    return this.http.get<PaginatedUsersResponse>(this.baseUrl, { params: httpParams });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  restoreUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/restore`, {});
  }

  sendPasswordResetEmail(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/reset-password-email`, {});
  }

  getResetPasswordStatus(id: number): Observable<{ hasActiveToken: boolean }> {
    return this.http.get<{ hasActiveToken: boolean }>(`${this.baseUrl}/${id}/reset-password-status`);
  }

  getAvailableRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.rolesUrl);
  }
}

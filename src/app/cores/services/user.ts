import { Injectable, signal } from '@angular/core';
import { LoginModel, UserModel } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private profileUpdatedSubject = new Subject<void>();
  public profileUpdated$ = this.profileUpdatedSubject.asObservable();
  public currentUserProfile = signal<any>(null);//to save user profile data
  constructor(private http: HttpClient) { }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('token', accessToken);           // keep 'token' key (interceptor uses it)
    localStorage.setItem('refreshToken', refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('token');
  }
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  private normalizeRole(role: string | null | undefined): string | null {
    if (!role) {
      return null;
    }

    const value = role.trim().toLowerCase();
    return value || null;
  }
  private setStoredRole(role: string | null): void {
    const normalizedRole = this.normalizeRole(role);
  }
  notifyProfileUpdated() {
    this.profileUpdatedSubject.next();
  }
  get(): Observable<RootModel> {
    let url: string = `${environment.apiUrl}/api/user`;
    return this.http.get<RootModel>(url);
  }

  create(model: UserModel): Observable<RootModel> {
    return this.http.post<RootModel>(`${environment.apiUrl}/api/user`, model);
  }

  update(id: string, model: UserModel): Observable<RootModel> {
    return this.http.put<RootModel>(`${environment.apiUrl}/api/user/${id}`, model)
  }

  delete(id: string): Observable<RootModel> {
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/user/${id}`, {})
  }

  
  login(credential: LoginModel): Observable<RootModel> {
    return this.http
      .post<RootModel>(`${environment.apiUrl}/api/auth/login`, credential)
      .pipe(
        tap((res: RootModel) => {
          if (res.success && res.data) {
            // res.data = { accessToken, refreshToken, expiresIn }
            this.saveTokens(res.data.accessToken, res.data.refreshToken);
          }
        })
      );
  }

  refresh(): Observable<RootModel> {
    const accessToken = this.getAccessToken() ?? '';
    const refreshToken = this.getRefreshToken() ?? '';
    return this.http
      .post<RootModel>(`${environment.apiUrl}/api/auth/refresh`, {
        accessToken,
        refreshToken,
      })
      .pipe(
        tap((res: RootModel) => {
          if (res.success && res.data) {
            // Rotate: replace both tokens with fresh ones
            this.saveTokens(res.data.accessToken, res.data.refreshToken);
          }
        })
      );
  }
  logout(): void {
    const refreshToken = this.getRefreshToken() ?? '';
    // Tell the backend to revoke the refresh token (fire-and-forget)
    if (refreshToken) {
      this.http
        .post(`${environment.apiUrl}/api/auth/logout`,
          JSON.stringify(refreshToken),
          { headers: { 'Content-Type': 'application/json' } }
        )
        .subscribe({ error: () => { } }); // ignore errors on logout
    }
    this.clearTokens();
    this.currentUserProfile.set(null);
  }

   userProfile(): Observable<RootModel> {
    return this.http
      .get<RootModel>(`${environment.apiUrl}/api/auth/profile`)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.currentUserProfile.set(res.data);
          }
        })
      );
  }
// notifyProfileUpdated() {
//     this.profileUpdatedSubject.next();
//   }
  changeStatus(id: string): Observable<RootModel> {
    return this.http.put<RootModel>(`${environment.apiUrl}/api/user/${id}/update-status`, {})
  }

  convertBase64(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      result.next((event?.target?.result ?? "").toString().split(',')[1]);
    };
    return result;
  }

}

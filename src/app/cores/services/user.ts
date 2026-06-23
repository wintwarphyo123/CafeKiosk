import { Injectable, signal } from '@angular/core';
import { LoginModel, UserModel } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
   public currentUserProfile=signal<any>(null);//to save user profile data
  constructor (private http:HttpClient){}
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
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/user`;
    return this.http.get<RootModel>(url);
  }

  create(model:UserModel):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/user`,model);
  }

  update(id:string,model:UserModel):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/user/${id}`,model)
  }

  delete(id:string):Observable<RootModel>{
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/user/${id}`,{})
  }

  login(credential:LoginModel):Observable<RootModel>{
    return this.http.post<RootModel>(`${environment.apiUrl}/api/auth/login`,credential,{ withCredentials: true })
  }

  userProfile():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/auth/profile`,{ withCredentials: true })
    .pipe(
        tap(res => {
          if (res.success && res.data) {
            const role = res.data?.role ?? res.data?.userRole ?? null;

            this.currentUserProfile.set(res.data);
            this.setStoredRole(typeof role === 'string' ? role : null);
          }
        })
      );
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

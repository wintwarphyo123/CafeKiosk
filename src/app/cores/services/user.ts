import { Injectable } from '@angular/core';
import { UserModel } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor (private http:HttpClient){}
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

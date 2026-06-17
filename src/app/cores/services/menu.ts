import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuModel } from '../models/menu.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/menu`;
    return this.http.get<RootModel>(url);
  }

  create(model:MenuModel):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/menu`,model);
  }

  update(id:number,model:MenuModel):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/menu/${id}`,model)
  }

  delete(id:number):Observable<RootModel>{
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/menu/${id}`,{})
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

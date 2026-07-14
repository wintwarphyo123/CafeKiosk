import { Injectable } from '@angular/core';
import { CategoryModel } from '../models/category.model';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/category`;
    return this.http.get<RootModel>(url);
  }

  create(model:CategoryModel):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/category`,model);
  }

  update(id:number,model:CategoryModel):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/category/${id}`,model)
  }

  delete(id:number):Observable<RootModel>{
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/category/${id}`,{})
  }
  changeStatus(id:number):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/category/${id}/update-status`,{})
  }
  getDeletedData():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/category/deleted`);
  }
  restoreData(id:number):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/category/${id}/restore`,{})
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

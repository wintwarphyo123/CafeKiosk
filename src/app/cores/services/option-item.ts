import { Injectable } from '@angular/core';
import { OptionItemModel } from '../models/option-item.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class OptionItemService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/optionItem`;
    return this.http.get<RootModel>(url);
  }

  create(model:OptionItemModel):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/optionItem`,model);
  }

  update(id:number,model:OptionItemModel):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/optionItem/${id}`,model)
  }

  delete(id:number):Observable<RootModel>{
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/optionItem/${id}`,{})
  }
  changeStatus(id:number):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/optionItem/${id}/update-status`,{})
  }
}

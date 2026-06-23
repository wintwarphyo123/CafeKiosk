import { Injectable } from '@angular/core';
import { OptionGroupModel } from '../models/option-group.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class OptionGroupService {
   constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/optionGroup`;
    return this.http.get<RootModel>(url);
  }

  create(model:OptionGroupModel):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/optionGroup`,model);
  }

  update(id:number,model:OptionGroupModel):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/optionGroup/${id}`,model)
  }

  delete(id:number):Observable<RootModel>{
    return this.http.delete<RootModel>(`${environment.apiUrl}/api/optionGroup/${id}`,{})
  }
}

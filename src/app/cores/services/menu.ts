import { HttpClient } from '@angular/common/http';
import { enableProfiling, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuModel } from '../models/menu.model';
import { RootModel } from '../models/root.model';
import { RequestMenuOptionGroupDto } from '../models/menu-detail.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/menu`;
    return this.http.get<RootModel>(url);
  }

  getMenu():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/menu/Kiosk-menus`);
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

  getAllCategories():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/menu/all_categories`);
  }

  getAllOptionGroups():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/menu/all-option-groups`)
  }

  getMenudetail(id:number):Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/menu/detail/${id}`)
  }

  linkOptionGroup(dto: RequestMenuOptionGroupDto):Observable<RootModel>{
    return this.http.post<RootModel>(`${environment.apiUrl}/api/menu/link-option-group`,dto)
  }

  getDeletedData():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/menu/deleted`);
  }
  restoreData(id:number):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/menu/${id}/restore`,{})
  }

  changeStatus(menuId:number):Observable<RootModel>{
    return this.http.put<RootModel>(`${environment.apiUrl}/api/menu/${menuId}/available`,{})
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

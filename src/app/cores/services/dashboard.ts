import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/dashboard/summary`;
    return this.http.get<RootModel>(url);
  }
  getAllTrendingItem():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/dashboard/trending_item`);
  }

  getFirstFiveOrder():Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/dashboard/first_five_orders`);
  }
  getRevenue(period:string):Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/dashboard/Revenue_Overview?period=${period}`);
  }
}

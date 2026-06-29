import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';
import { ConfirmPaymentRequest, OrderRequest } from '../models/order-detail.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor (private http:HttpClient){}
  get():Observable<RootModel>{
    let url:string=`${environment.apiUrl}/api/order`;
    return this.http.get<RootModel>(url);
  }

  create(model:OrderRequest):Observable<RootModel>{
     return this.http.post<RootModel>(`${environment.apiUrl}/api/order`,model);
  }
  
  confirmPayment(model:ConfirmPaymentRequest){
    return this.http.put<RootModel>(`${environment.apiUrl}/api/order/confirmPayment`,model);
  }

  viewDetail(id:number):Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/order/${id}`)
  }

  startPreparingOrder(orderId: number): Observable<RootModel> {
    return this.http.put<RootModel>(`${environment.apiUrl}/api/order/${orderId}/prepare`, {});
  }

  // Maps to [HttpPut("{orderId}/complete")]
  completeOrder(orderId: number): Observable<RootModel> {
    return this.http.put<RootModel>(`${environment.apiUrl}/api/order/${orderId}/complete`, {});
  }

  // Generic backup endpoint
  updateOrderStatus(orderId: number, status: string): Observable<RootModel> {
    return this.http.put<RootModel>(`${environment.apiUrl}/api/order/${orderId}/status`, { status });
  }

  

}

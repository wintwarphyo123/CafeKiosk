import { HttpClient, HttpParams } from '@angular/common/http';
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
  get(status: string): Observable<RootModel> {
    let url: string = `${environment.apiUrl}/api/order?orderStatus=${status}`;
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

  filterOrdersByDate(startDate: string, endDate: string): Observable<RootModel> {
    const url = `${environment.apiUrl}/api/order/filter?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<RootModel>(url);
  }
  getOrderStatusTimeline(orderId:number):Observable<RootModel>{
    return this.http.get<RootModel>(`${environment.apiUrl}/api/Order/order-status/${orderId}`);
  }

  exportToExcel(
    startDate: string | null | undefined,
    endDate: string | null | undefined,
    q: string | null | undefined,
    sortField: string | null | undefined,
    order: number,
    columns: { key: string; value: string }[]
  ): Observable<Blob> {
    
    let params = new HttpParams();
    
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    if (q) params = params.set('q', q);
    if (sortField) params = params.set('sortfield', sortField);
    params = params.set('order', order.toString());

    return this.http.post(`${environment.apiUrl}/api/order/excel`, columns, {
      params: params,
      responseType: 'blob' 
    });
  }

  

}

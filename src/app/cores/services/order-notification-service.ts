import { Injectable } from '@angular/core';
import { OrderModel } from '../models/order.model';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderNotificationService {
  private socket: Socket;
  private newOrder$ = new Subject<OrderModel>();

  constructor() {
  
    this.socket = io('http://localhost:3000'); 

    
    this.socket.on('newOrderCreated', (order: OrderModel) => {
      this.newOrder$.next(order);
    });
  }

  getOnNewOrder(): Observable<OrderModel> {
    return this.newOrder$.asObservable();
  }
}

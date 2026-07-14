import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderNotificationService {

  public hubConnection!: signalR.HubConnection;

  private countSubject = new BehaviorSubject<number>(0);
  notificationCount$ = this.countSubject.asObservable();

  private orderRefreshSource = new Subject<void>();
  orderRefresh$ = this.orderRefreshSource.asObservable();

  private categoryUpdateSource = new Subject<any>();
  categoryUpdate$ = this.categoryUpdateSource.asObservable();

  private menuUpdateSource = new Subject<any>();
  menuUpdate$ = this.menuUpdateSource.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7137/notificationHub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected Successfully!'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    this.hubConnection.on('newOrderCreated', (order: any) => {
      console.log("New paid order received: ", order);
      this.countSubject.next(this.countSubject.value + 1);
      this.orderRefreshSource.next();
    });
    this.hubConnection.on('ReceiveCategoryUpdate', (categoryData: any) => {
      this.categoryUpdateSource.next(categoryData);
    });
  
    this.hubConnection.on('ReceiveMenuUpdate', (menuData: any) => {
      this.menuUpdateSource.next(menuData);
    });
  
  }

  clearNotifications(): void {
    this.countSubject.next(0);
  }

  public listenForOrderReady(callback: (data: any) => void) {
    this.hubConnection.on('orderStatusUpdated', (data) => {
      callback(data);
    });
  } listenForNewOrder(callback: (data: any) => void): void {
    this.hubConnection.on('newOrderCreated', (data) => {
      callback(data);
    });
  }

  listenForCategoryUpdate(callback: (data: any) => void): void {
    this.hubConnection.on('ReceiveCategoryUpdate', (data) => {
      callback(data);
    });
  }

  listenForMenuUpdate(callback: (data: any) => void): void {
    this.hubConnection.on('ReceiveMenuUpdate', (data) => {
      callback(data);
    });
  }

}

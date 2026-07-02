import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderNotificationService {
              
 private hubConnection!: signalR.HubConnection;
  
  private countSubject = new BehaviorSubject<number>(0);
  notificationCount$ = this.countSubject.asObservable();

  private orderRefreshSource = new Subject<void>();
  orderRefresh$ = this.orderRefreshSource.asObservable();

  constructor() {
    // Connect to your WebSocket server
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7137/notificationHub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    // SignalR ကို စတင် ချိတ်ဆက်ပါမယ်
    this.hubConnection.start()
      .then(() => console.log('SignalR Connected Successfully!'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    // Backend (C#) ကနေ 'newOrderCreated' လို့ လှမ်းအော်ရင် ဖမ်းယူမယ့်အပိုင်း
    this.hubConnection.on('newOrderCreated', (order: any) => {
      console.log("New paid order received: ", order);
      this.countSubject.next(this.countSubject.value + 1);
      this.orderRefreshSource.next();
    });
  }

  clearNotifications(): void {
    this.countSubject.next(0);
  }

  public listenForOrderReady(callback: (data: any) => void) {
  this.hubConnection.on('orderStatusUpdated', (data) => {
    callback(data);
  });
}
}

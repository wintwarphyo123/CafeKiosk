import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OrderService } from '../../cores/services/order';
import { OrderNotificationService } from '../../cores/services/order-notification-service';

@Component({
  selector: 'app-order-pickup-dashboard',
  imports: [CommonModule, CardModule, DividerModule],
  templateUrl: './order-pickup-dashboard.html',
  styleUrl: './order-pickup-dashboard.scss',
})
export class OrderPickupDashboard implements OnInit {
  currentPreparingOrder: any = null; 
  waitingOrders: any[] = [];         
  readyOrders: any[] = [];
  private orderTimeouts: { [key: number]: any } = {};

  constructor(
    private orderService:OrderService,
    private notificationService:OrderNotificationService,
    private cdr:ChangeDetectorRef,
  ){}
  ngOnInit(): void {
    this.getActiveOrder();
    this.listenToLiveUpdate();
  }
  getActiveOrder():void{
    this.orderService.getActiveOrders().subscribe({
      next:(res)=>{
        if(res.success && res.data){
          this.processOrdersList(res.data);
        }
      }
    });
  }

  listenToLiveUpdate(){
    this.notificationService.listenForOrderReady((data: any) => {
      console.log("TV Dashboard Live Status Received:", data);
      const incomingOrderId = data.orderId ?? data.OrderId ?? data.id;
      const incomingOrderStatus = data.orderStatus ?? data.OrderStatus ?? data.order_status;
      const incomingOrderNumber = data.orderNumber ?? data.OrderNumber ?? data.orderNo;

      this.clearOrderFromAllLists(incomingOrderId);

      const updatedOrder = {
        orderId: incomingOrderId,
        orderNumber: incomingOrderNumber,
        orderStatus: incomingOrderStatus
      };

      if (incomingOrderStatus === 'Paid') {
        this.waitingOrders.push(updatedOrder);
      } 
      else if (incomingOrderStatus === 'Preparing') {
        this.currentPreparingOrder = updatedOrder; 
      } 
      else if (incomingOrderStatus === 'Ready') {
        if (this.currentPreparingOrder?.orderId === incomingOrderId) {
          this.currentPreparingOrder = null;
        }
        this.readyOrders.push(updatedOrder);
        if (this.orderTimeouts[incomingOrderId]) {
        clearTimeout(this.orderTimeouts[incomingOrderId]);
      }

       this.orderTimeouts[incomingOrderId]= setTimeout(() => {
          this.readyOrders = this.readyOrders.filter(o => o.orderId !== incomingOrderId);
          delete this.orderTimeouts[incomingOrderId];
          this.cdr.detectChanges();
        }, 180000);
      }

      this.cdr.detectChanges();
    });
  }
  private processOrdersList(allOrders: any[]) {
    const preparing = allOrders.find(o => o.orderStatus === 'Preparing');
    this.currentPreparingOrder = preparing ? preparing : null;

    this.waitingOrders = allOrders.filter(o => o.orderStatus === 'Paid');

    // Build ready list and start 3-min auto-remove timers for each pre-existing Ready order
    this.readyOrders = allOrders.filter(o => o.orderStatus === 'Ready');
    this.readyOrders.forEach(order => {
      // Avoid double-registering a timeout
      if (this.orderTimeouts[order.orderId]) {
        clearTimeout(this.orderTimeouts[order.orderId]);
      }
      this.orderTimeouts[order.orderId] = setTimeout(() => {
        this.readyOrders = this.readyOrders.filter(o => o.orderId !== order.orderId);
        delete this.orderTimeouts[order.orderId];
        this.cdr.detectChanges();
      }, 180000); // 3 minutes
    });

    this.cdr.detectChanges();
  }
  private clearOrderFromAllLists(orderId: number) {
    if (this.currentPreparingOrder?.orderId === orderId) {
      this.currentPreparingOrder = null;
    }
    this.waitingOrders = this.waitingOrders.filter(o => o.orderId !== orderId);
    this.readyOrders = this.readyOrders.filter(o => o.orderId !== orderId);
  }
}

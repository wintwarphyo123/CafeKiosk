import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

import { OrderResponseDto } from '../../cores/models/order-detail.model';
import { SortColumn } from '../../cores/models/root.model';
import { OrderService } from '../../cores/services/order';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderNotificationService } from '../../cores/services/order-notification-service';

@Component({
  selector: 'app-kitchen-dashboard',
  imports: [
    FormsModule,
    ToastModule,
    ReactiveFormsModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    TableModule,
    ConfirmDialogModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    ImageModule,
    TagModule,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './kitchen-dashboard.html',
  styleUrl: './kitchen-dashboard.scss',
})
export class KitchenDashboard implements OnInit, OnDestroy {
  orderModel: OrderResponseDto[] = [];
  selectedOrder: OrderResponseDto | null = null;
  filteredOrders: OrderResponseDto[] = [];

  isLoading: boolean = false;
  sidebarVisible: boolean = false;
  isUpdatingStatus: boolean = false;
  cols!: SortColumn[];
  searchText: string = '';
  selectedStatus: string = 'All';
  shouldHighlightNew: boolean = false;
  latestIncomingOrderId: number | null = null;

  statusOptions: string[] = ['Pending', 'Paid', 'Preparing', 'Ready', 'Cancelled'];

  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();


  private ordersLoaded$ = new Subject<OrderResponseDto[]>();

  public orderForm: FormGroup = this.formBuilder.group({
    orderId: [0],
    orderNumber: [''],
    totalAmount: [''],
    orderStatus: [''],
    phoneNumber: [''],
    note: [''],
    createdAt: [new Date().toISOString().slice(0, 10)]
  });

  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private orderNotificationService: OrderNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'orderNumber', header: 'Order Number' },
      { field: 'totalAmount', header: 'Total Amount' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'note', header: 'Transition Note' },
      { field: 'createdAt', header: 'Ordered Date' },
    ];

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['highlightNewOrder'] === 'true') {
          this.shouldHighlightNew = true;

          // Clear highlight condition cleanly after 5 seconds
          setTimeout(() => {
            this.shouldHighlightNew = false;
          }, 5000);
        }
      });

    this.initSearchPipeline();
    this.loadData();
    this.listenForRefreshSignals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private listenForRefreshSignals(): void {
  this.orderNotificationService.orderRefresh$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.loadData();
    });
    this.orderNotificationService.listenForOrderReady((data:any)=>{
      console.log("Kitchen Dashboard received Real-time Refresh Trigger:", data);
      this.loadData();
    });
}

  isLatestIncoming(orderId: number): boolean {
    return this.latestIncomingOrderId === orderId;
  }

  loadData(): void {
    this.isLoading = true;
    this.orderService.get(this.selectedStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to sync orders trace.'
          });
          return;
        }

        const rawItem = Array.isArray(res.data) ? res.data : [];
        this.orderModel = rawItem.map((item) => ({
          orderId: item.orderId ?? 0,
          orderNumber: item.orderNumber ?? '',
          totalAmount: item.totalAmount ?? 0,
          orderStatus: item.orderStatus ?? 'Pending',
          phoneNumber: item.phoneNumber ?? '',
          note: item.note ?? '',
          createdAt: item.createdAt ?? new Date(),
          updatedAt:item.updatedAt ?? new Date(),
          orderItems: item.orderItems ?? []
        }));

        this.ordersLoaded$.next(this.orderModel);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Error',
          detail: 'System communication failure'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initSearchPipeline(): void {
    combineLatest([
      this.ordersLoaded$,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([orders, params]) => {
        this.searchText = params['search'] || '';
        const searchKey = params['search'] || '';
        const statusKey = params['status'] || 'All';
        this.applyFilter(searchKey, statusKey, orders);
      });
  }

  applyFilter(searchKey: string, statusKey: string, currentOrders: OrderResponseDto[]): void {
    let cleanKey = (searchKey || '').trim().toLowerCase();

    if (cleanKey.startsWith('#')) {
      cleanKey = cleanKey.substring(1);
    }

    let result = currentOrders;
    if (statusKey !== 'All') {
      result = result.filter(o => o.orderStatus.toLowerCase() === statusKey.toLowerCase());
    }
    // if (statusKey && statusKey !== 'All') {
    //   result = result.filter(o => o.orderStatus.toLowerCase() === statusKey.toLowerCase());
    // }
    if (cleanKey) {
      this.filteredOrders = currentOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(cleanKey) 
      );
    }
    else {

      this.filteredOrders = [...result];
    }
    //this.filteredOrders = result;
    this.cdr.detectChanges();
  }

  viewDetail(order: OrderResponseDto): void {
    this.isLoading = true;
    this.orderService.viewDetail(order.orderId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {

          this.selectedOrder = {
            ...res.data,
           orderItems: (res.data.orderItems ?? []).map((subItem: any) => ({
              orderItemId: subItem.orderItemId,
              quantity: subItem.quantity,
              menuName: subItem.menuName ?? subItem.itemName ?? '',
              priceAtOrder: subItem.priceAtOrder ?? subItem.price ?? 0,
              selectedOptions: subItem.selectedOptions ?? [] 
            }))
          };
          console.log('Selected Order Details:', this.selectedOrder);
          this.sidebarVisible = true;

          this.orderForm.patchValue({
            orderId: res.data.orderId,
            orderNumber: res.data.orderNumber,
            totalAmount: res.data.totalAmount,
            orderStatus: res.data.orderStatus,
            phoneNumber: res.data.phoneNumber,
            note: res.data.note,
            createdAt: res.data.createdAt
          });
        } else {
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Details Error',
            detail: 'Could not fetch order specifics.'
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Server Error',
          detail: 'Could not communicate order sub-parameters.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(newStatus: string): void {
    if (!this.selectedOrder) return;
    const transitioningStatus = newStatus.toLowerCase();
    if (transitioningStatus === 'preparing' || transitioningStatus === 'ready'){
     const activeKitchenQueue = this.orderModel
    .filter(o => ['paid', 'preparing'].includes(o.orderStatus.toLowerCase()))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (activeKitchenQueue.length > 0 && activeKitchenQueue[0].orderId !== this.selectedOrder.orderId) {
   // if (['preparing', 'ready'].includes(newStatus.toLowerCase())) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Queue Order Enforced',
        detail: `Please finish cooking Order #${activeKitchenQueue[0].orderNumber} first.`
      });
      return;
   // }
  }
 
    }
    if(newStatus==='Ready' && this.selectedOrder.orderStatus !== 'Preparing'){
      this.messageService.add({
      severity: 'warn',
      summary: 'Action Blocked',
      detail: 'This order must be in "Preparing" status before it can be marked as Ready.'
    });
    return;
    }

    this.isUpdatingStatus = true;
    const orderId = this.selectedOrder.orderId;
    let statusObservable$: Observable<any>;

    switch (newStatus) {
      case 'Preparing':
        statusObservable$ = this.orderService.startPreparingOrder(orderId);
        break;
      case 'Ready':
        statusObservable$ = this.orderService.completeOrder(orderId);
        break;
      default:
        statusObservable$ = this.orderService.updateOrderStatus(orderId, newStatus);
        break;
    }

    statusObservable$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isUpdatingStatus = false;
        console.log('Status update response:', res);
        if (res.success) {
          this.selectedOrder!.orderStatus = newStatus;

          const match = this.orderModel.find(o => o.orderId === orderId);
          if (match) {
            match.orderStatus = newStatus;
          }

          this.ordersLoaded$.next(this.orderModel);

          this.messageService.add({
            severity: 'success',
            summary: 'Status Synchronized',
            detail: res.message || `Order status updated to ${newStatus}`
          });
          this.loadData();
          this.sidebarVisible=false;
          
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Transaction Failed',
            detail: res.message || 'Could not update status'
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Server Error',
          detail: 'Communication failure during status alteration.'
        });
      }
    });
  }

  getPaymentSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'Paid':
      case 'Ready':
        return 'success';
      case 'Pending':
        return 'warn';
      case 'Preparing':
        return 'info';
      case 'Cancelled':
      case 'Failed':
        return 'danger';
      default:
        return 'info';
    }
  }

  changeStatus(status: string) {
    this.selectedStatus = status;
    this.onFilterChange();
  }

  onFilterChange() {
    this.router.navigate(['/staff/kitchen-dashboard'], {
      queryParams: {
        status: this.selectedStatus
      },
      queryParamsHandling: 'merge'
    });
  }

  isNewOrder(order: any): boolean {
    // Example condition: Highlight if the flag is active AND order status is 'Pending'/'New'
    return this.shouldHighlightNew && order.status === 'New'; 
  }

}
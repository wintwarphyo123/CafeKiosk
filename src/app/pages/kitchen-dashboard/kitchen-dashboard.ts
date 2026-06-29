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
    CurrencyPipe,
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

  statusOptions: string[] = ['Pending', 'Paid', 'Preparing', 'Ready', 'Cancelled'];

  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  
  // ဒေတာ ရောက်မောက်ချင်းကို စောင့်ကြည့်ထိန်းချုပ်ရန် Stream များ
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
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
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
    
    // စနစ်နှစ်ခုလုံး (API data ဝင်လာခြင်း + URL Query ပြောင်းလဲခြင်း) ကို အချိန်ကိုက် ညှိနှိုင်းစောင့်ကြည့်ခြင်း
    this.initSearchPipeline();
    
    // အော်ဒါများ ဆွဲယူခြင်း
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.orderService.get().pipe(takeUntil(this.destroy$)).subscribe({
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
          // FIXED: မော်ဒယ် dialog ထဲမှာ item စာရင်းတွေ ပေါ်မလာတဲ့ပြဿနာကို ဖြေရှင်းရန် orderItems ကို သေချာစွာ map လုပ်ပေးထားပါတယ်
          orderItems: item.orderItems ?? []
        }));
        
        // ပိုက်လိုင်းထဲသို့ ဒေတာအသစ်များကို တွန်းပို့ပေးခြင်း
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
      const searchKey = params['search'] || '';
      const statusKey=params['status'] || 'All';
      this.applyFilter(searchKey,statusKey, orders);
    });
  }

  applyFilter(searchKey: string,statusKey: string, currentOrders: OrderResponseDto[]): void {
    let cleanKey = searchKey.trim().toLowerCase();
    
    if (cleanKey.startsWith('#')) {
      cleanKey = cleanKey.substring(1);
    }

    let result = currentOrders;
    if (statusKey !== 'All') {
      result = result.filter(o => o.orderStatus.toLowerCase() === statusKey.toLowerCase());
    }
    
    if (cleanKey) {
      this.filteredOrders = currentOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(cleanKey) ||
        (order.phoneNumber && order.phoneNumber.includes(cleanKey))
      );
    } 
    else {

      this.filteredOrders = [...currentOrders];
    }
    this.filteredOrders=result;
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
            orderItems: res.data.orderItems ?? [] 
          };
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

          this.cdr.detectChanges();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Transaction Failed',
            detail: res.message || 'Could not update status'
          });
        }
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
}
import {  DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { OrderModel } from '../../cores/models/order.model';
import { SortColumn } from '../../cores/models/root.model';
import { OrderService } from '../../cores/services/order';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderNotificationService } from '../../cores/services/order-notification-service';

@Component({
  selector: 'app-orders',
  standalone: true,
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
    DatePipe
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit, OnDestroy {
  
  orderModel: any[] = [];
  filteredOrders: OrderModel[] = []; // Matches kitchen dashboard reactive trace array
  isLoading: boolean = false;
  modelVisible: boolean = false;
  selectedOrder: OrderModel | null = null;
  cols!: SortColumn[];
  selectedStatus: string = 'All';

  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private ordersLoaded$ = new Subject<OrderModel[]>(); // Emits when API loads base elements

  public orderForm: FormGroup = this.formBuilder.group({
    orderId: [0],
    orderNumber: [''],
    totalAmount: [''],
    orderStatus: [''],
    phoneNumber: [''],
    note: [''],
    createdAt: [new Date().toISOString().slice(0, 10)],
    updatedAt:[new Date().toISOString().slice(0, 10)]
  });

  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private orderNotificationService: OrderNotificationService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'orderNumber', header: 'Order Number' },
      { field: 'totalAmount', header: 'Total Amount' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'note', header: 'Transaction Note' },
      { field: 'createdAt', header: 'Ordered Date' },
      { field: 'updatedAt', header: 'Updated Date' },
    ];

    this.initPipeline();
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
  }

  loadData() {
    this.isLoading = true;
    this.orderService.get('All').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Error',
            detail: 'Order data could not be retrieved'
          });
          return;
        }
        const rawItems = Array.isArray(res.data) ? res.data : [];
        //  this.orderModel = rawItem.map((item) => {
        //   const rawDate = item.createdAt || null;
        //   const formattedDate = rawDate
        //     ? this.datePipe.transform(rawDate, 'yyyy MMMM dd')
        //     : '';
           
          this.orderModel = rawItems.map((item) =>({
            ...item,
          orderId: item.orderId ?? 0,
          orderNumber: item.orderNumber ?? '',
          totalAmount: item.totalAmount ?? 0,
          orderStatus: item.orderStatus ?? '',
          phoneNumber: item.phoneNumber ?? '',
          note: item.note ?? '',
          createdAt: item.createdAt ?? '',
          updatedAt:item.updatedAt?? ''
          }));

        this.ordersLoaded$.next(this.orderModel);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred fetching orders'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initPipeline(): void {
    combineLatest([
      this.ordersLoaded$,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([orders, params]) => {
        this.selectedStatus = params['status'] || 'All';
        this.applyFilter(this.selectedStatus, orders);
      });
  }

  applyFilter(statusKey: string, currentOrders: OrderModel[]): void {
    let result = currentOrders;
  
    if (statusKey !== 'All') {
      result = result.filter(o => o.orderStatus.toLowerCase() === statusKey.toLowerCase());
    }

    this.filteredOrders = result;
    this.cdr.detectChanges();
  }

  viewDetail(orderDetail: any) {
    this.router.navigate(['/admin/order/detail', orderDetail.orderId]);
  }

  changeStatus(status: string) {
    this.selectedStatus = status;
    this.onFilterChange();
  }

  onFilterChange() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.selectedStatus
      },
      queryParamsHandling: 'merge'
    });
  }
}
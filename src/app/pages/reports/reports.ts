import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { OrderModel } from '../../cores/models/order.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SortColumn } from '../../cores/models/root.model';
import { OrderService } from '../../cores/services/order';
import { OrderNotificationService } from '../../cores/services/order-notification-service';

@Component({
  selector: 'app-reports',
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
    CurrencyPipe,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {

  orderModel: OrderModel[] = [];
  filteredOrders: OrderModel[] = []; // Matches kitchen dashboard reactive trace array
  isLoading: boolean = false;
  modelVisible: boolean = false;
  selectedOrder: OrderModel | null = null;
  cols!: SortColumn[];
  selectedStatus: string = 'All';
  startDate: Date | null = null;
  endDate: Date | null = null;
  searchValue: string = ''; 
  sortField: string = 'createdAt';
  sortOrder: number = -1;

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
    createdAt: [new Date().toISOString().slice(0, 10)]
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
    // Whenever a new order hits the service socket, reload table entries automatically
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
        const rawItem = Array.isArray(res.data) ? res.data : [];
        this.orderModel = rawItem.map((item) => {
          const rawDate = item.createdAt || null;
          const formattedDate = rawDate
            ? this.datePipe.transform(rawDate, 'yyyy MMMM dd')
            : '';

          return {
            orderId: item.orderId ?? 0,
            orderNumber: item.orderNumber ?? '',
            totalAmount: item.totalAmount ?? '',
            orderStatus: item.orderStatus ?? '',
            phoneNumber: item.phoneNumber ?? '',
            note: item.note ?? '',
            createdAt: formattedDate ?? '',
          };
        });

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

  viewDetail(orderDetail: OrderModel) {
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
 exportToExcel() {
    this.isLoading = true;

    const startDateStr = this.startDate ? this.datePipe.transform(this.startDate, 'yyyy-MM-dd') : '';
    const endDateStr = this.endDate ? this.datePipe.transform(this.endDate, 'yyyy-MM-dd') : '';


    const columnsBody = this.cols.map(col => {
    const pascalKey = col.field.charAt(0).toUpperCase() + col.field.slice(1);
    return {
      key: pascalKey, 
      value: col.header
    };
  });

    this.orderService.exportToExcel(
      startDateStr,
      endDateStr,
      this.searchValue,
      this.sortField,
      this.sortOrder,
      columnsBody
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        if (startDateStr && endDateStr) {
          a.download = `Orders_Report_${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}.xlsx`;
        } else {
          a.download = `all_orders_${this.datePipe.transform(new Date(), 'yyyyMMdd')}.xlsx`;
        }

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Export Failed',
          detail: 'No orders found for the selected filter or failed to generate report.'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  onDateChange() {
    this.isLoading = true;
    const startDateStr = (this.startDate ? this.datePipe.transform(this.startDate, 'yyyy-MM-dd') : '') as string;
    const endDateStr = (this.endDate ? this.datePipe.transform(this.endDate, 'yyyy-MM-dd') : '') as string;

    if (!startDateStr || !endDateStr) {
      this.messageService.add({
        key: 'globalMessage',
        severity: 'error',
        summary: 'Error',
        detail: 'Please select both start and end dates.'
      });
      this.isLoading = false;
      return;
    }

    this.orderService.filterOrdersByDate(startDateStr, endDateStr).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to filter orders by date.'
          });
          return;
        }

        const rawItem = Array.isArray(res.data) ? res.data : [];
        this.filteredOrders = rawItem.map((item) => {
          const rawDate = item.createdAt || null;
          const formattedDate = rawDate
            ? this.datePipe.transform(rawDate, 'yyyy MMMM dd')
            : '';

          return {
            orderId: item.orderId ?? 0,
            orderNumber: item.orderNumber ?? '',
            totalAmount: item.totalAmount ?? '',
            orderStatus: item.orderStatus ?? '',
            phoneNumber: item.phoneNumber ?? '',
            note: item.note ?? '',
            createdAt: formattedDate ?? '',
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while filtering orders by date.'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}

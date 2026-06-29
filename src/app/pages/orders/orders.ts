import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
import { OrderModel } from '../../cores/models/order.model';
import { SortColumn } from '../../cores/models/root.model';
import { OrderService } from '../../cores/services/order';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
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
    ToastModule,
    DialogModule,
    SelectModule,
    ImageModule,
    CurrencyPipe,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  
  orderModel: OrderModel[] = [];
  isLoading: boolean = false;
  modelVisible: boolean = false;
  selectedOrder: OrderModel | null = null;
  cols!: SortColumn[];

  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  private formBuilder = inject(FormBuilder);
  //orderId,orderNumber,totalAmount,orderStatus,phoneNumber,note,createdAt
  public orderForm: FormGroup = this.formBuilder.group({
    orderId: [0],
    orderNumber: [''],
    totalAmount: [''],
    orderStatus: [''],
    phoneNumber: [''],
    note: [''],
    createdAt: [new Date().toISOString().slice(0, 10)]

  });

  ngOnInit(): void {
    this.cols = [
      { field: 'orderNumber', header: 'Order Number' },
      { field: 'totalAmount', header: 'Total Amount' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'note', header: 'Transition Note' },
      { field: 'createdAt', header: 'Ordered Date' },
    ]
    this.loadData();
  }
  loadData() {
    this.isLoading = true;
    this.orderService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Error',
            detail: 'order does not exist'
          });
        }
        const rawItem = Array.isArray(res.data) ? res.data : [];
        this.orderModel = rawItem.map((item) => {
          const rawDate = item.createdAt ?? null;
          // const formattedDate = rawDate
          //   ? this.datePipe.transform(rawDate, 'yyyy MMMM dd')
          //   : '';
          return {
            orderId: item.orderId ?? 0,
            orderNumber: item.orderNumber ?? '',
            totalAmount: item.totalAmount ?? '',
            orderStatus: item.orderStatus ?? '',
            phoneNumber: item.phoneNumber ?? '',
            note: item.note ?? '',
            createdAt: item.createdAt ?? this.datePipe.transform(item.createdAt, 'yyy MMM dd'),
          };
        });
        this.cdr.detectChanges();
        console.log(this.orderModel)
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Error',
          detail: 'order does not exist'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDetail(orderDetail: any) {
    this.router.navigate(['/admin/order/detail', orderDetail.orderId]);
  }
}

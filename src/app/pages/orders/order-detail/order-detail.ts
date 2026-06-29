import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderResponseDto } from '../../../cores/models/order-detail.model';
import { OrderService } from '../../../cores/services/order';

@Component({
  selector: 'app-order-detail',
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
    ImageModule,
    CurrencyPipe,
    TagModule,
    DatePipe,
    NgClass,
    AutoCompleteModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail implements OnInit {
  orderId!: number;
  statusOptions: { label: string; value: string }[] = [];
  selectedOrder: OrderResponseDto | null = null;
  isloading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private orderService: OrderService,
    private datePipe: DatePipe,
  ) { }

  ngOnInit(): void {
    this.statusOptions = [
      { label: 'Pending', value: 'Pending' },
      { label: 'Paid', value: 'Paid' },
      { label: 'Preparing', value: 'Preparing' },
      { label: 'Ready', value: 'Ready' },
      { label: 'Cancelled', value: 'Cancelled' }
    ];
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.orderId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isloading = true;

    this.orderService.viewDetail(this.orderId).subscribe({
      next: (res) => {
        this.isloading = false;
        if (res.success && res.data) {
          const Item = Array.isArray(res.data) ? res.data[0] : res.data;
          
          this.selectedOrder = {
            orderId: Item.orderId ?? 0,
            orderNumber: Item.orderNumber ?? '',
            createdAt: Item.createdAt ?? new Date(), 
            orderStatus: Item.orderStatus ?? 'Pending',
            phoneNumber:Item.phoneNumber ?? '',
            note: Item.note ?? '',
            totalAmount: Item.totalAmount ?? 0,
            orderItems: Item.orderItems ?? [] 
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isloading = false;
        console.error("Error fetching order detail data", err);
      }
    });
  }

  getPaymentSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': 
      case 'Preparing':
      case 'Ready': 
        return 'warn'; 
      case 'Cancelled': 
      case 'Failed': 
        return 'danger';
      default: return 'info';
    }
  }
}
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DashboardService } from '../../cores/services/dashboard';
import { DashboardModel, TrendingItemResponseModel } from '../../cores/models/dashboard.model';
import { TagModule } from "primeng/tag";
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    TagModule,
    SelectModule,
],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  constructor(
    private dashboardService: DashboardService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }
  dashboardModel: DashboardModel[] = [];
  trendingItemModel: TrendingItemResponseModel[] = [];
  counts = {
    menus: 0,
    categories: 0,
    orders: 0,
    revenue: 0,
    users: 0
  };


  chartData: any;
  chartOptions: any;
  firstFiveOrders: any[] = [];
  selectedPeriod: string = 'month';
  isLoading: boolean = false;
  periodOptions: { label: string, value: string }[] = [
    { label: 'Today', value: 'day' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' }
  ];

  ngOnInit() {
    this.loadData();
    this.initChartOptions();
    this.loadChartData();
    this.loadingTrendItems();
    this.loadOrderData();
  }

  loadData() {
    this.isLoading = true;
    this.dashboardService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        this.dashboardModel = res.data;
        this.counts = {
          menus: res.data.totalMenu || 0,
          categories: res.data.totalCategory || 0,
          orders: res.data.totalOrders || 0,
          revenue: res.data.totalRevenue || 0,
          users: res.data.totalStaff || 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Network error occurred.' });
        this.cdr.detectChanges();
      }
    })
  }

  loadOrderData() {
    this.isLoading = true;
    this.dashboardService.getFirstFiveOrder().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load orders.' });
          return;
        }
        // Assuming you have a property to hold the first five orders
        this.firstFiveOrders = res.data; // Uncomment and define firstFiveOrders if needed
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Network error occurred.' });
        this.cdr.detectChanges();
      }
    })
  }

  loadingTrendItems() {
    this.isLoading = true;
    this.dashboardService.getAllTrendingItem().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const trendingItem = Array.isArray(res.data) ? res.data : [];
          this.trendingItemModel = trendingItem.map((item) => ({
            menuId: item.menuId ?? 0,
            menuName: item.menuName ?? null,
            categoryName: item.categoryName ?? null,
            totalSales: item.totalSales ?? 0,
            percentage: item.percentage ?? 0.0,
          }));
          this.cdr.detectChanges();
          console.log(this.trendingItemModel);
        }
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Failed to load trending items.' });
        this.cdr.detectChanges();
      }
    })
    console.log(this.trendingItemModel)
  }

  initChartOptions() {
    this.chartOptions = {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          bodyFont: { size: 11, family: 'sans-serif' },
          titleFont: { size: 11, family: 'sans-serif' }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 10, family: 'sans-serif' },
            color: '#78716c'
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            font: { size: 10, family: 'sans-serif' },
            color: '#78716c', 
            callback: (value: number) => value.toLocaleString() + ' MMK' 
          },
          grid: {
            color: '#e7e5e4' 
          }
        }
      },
      maintainAspectRatio: false
    };
  }


  onPeriodChange() {
    this.loadChartData();
  }


  loadChartData() {
    this.isLoading = true;
    this.dashboardService.getRevenue(this.selectedPeriod).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.chartData = {
            labels: res.data.labels,
            datasets: [
              {
                label: this.selectedPeriod === 'day' ? 'Hourly Sales' :
                this.selectedPeriod === 'month' ? 'Weekly Sales' : 'Monthly Revenue',
                data: res.data.values,
                borderColor: '#b45309',
                backgroundColor: 'rgba(180, 83, 9, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#b45309',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#b45309'
              }
            ]
          };
          this.cdr.detectChanges();
        }
      },
      error:(err)=>{
        this.isLoading = false;
      this.messageService.add({ 
        key: 'globalMessage', 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to load revenue data.' 
      });
      this.cdr.detectChanges();
      }
    });
  }
}
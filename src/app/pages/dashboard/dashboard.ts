import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart'; 
import { MessageService, ConfirmationService } from 'primeng/api';
import { DashboardService } from '../../cores/services/dashboard';
import { DashboardModel } from '../../cores/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule
  ], 
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss' 
})
export class Dashboard implements OnInit {
  
  constructor(
    private dashboardService:DashboardService,
   private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ){}
  dashboardModel:DashboardModel[]=[];
  counts = {
    menus: 0,
    categories: 0,
    optionGroups: 0,
    optionItems: 0,
    users: 0
  };

  
  chartData: any;
  chartOptions: any;
  selectedPeriod: string = 'month'; 
  isLoading: boolean = false;

  ngOnInit() {
    this.loadData();    
    this.initChartOptions();   
    this.loadChartData();     
  }

  loadData() {
    this.isLoading=true;
    this.dashboardService.get().subscribe({
      next:(res)=>{
        this.isLoading=false;
        if(!res.success){
          this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        this.dashboardModel=res.data;
        this.counts = {
        menus: res.data.totalMenu || 0,
        categories: res.data.totalCategory || 0,
        optionGroups: res.data.totalOptionGroup || 0,
        optionItems: res.data.totalOptionItem || 0,
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
            color: '#78716c', // Stone-500 color
            callback: (value: number) => value.toLocaleString() + ' MMK' // ဂဏန်းများကို ကော်မာ (,) ဖြတ်ပေးရန်
          },
          grid: {
            color: '#e7e5e4' // Stone-200 အလျားလိုက်မျဉ်းများကို ခပ်ဖျော့ဖျော့သာ ပြပါမည်
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

    if (this.selectedPeriod === 'day') {
      this.chartData = {
        labels: ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'],
        datasets: [
          {
            label: 'Hourly Sales',
            data: [45000, 85000, 165000, 120000, 95000, 140000, 75000],
            backgroundColor: '#d97706',      // Amber-600 Theme
            hoverBackgroundColor: '#b45309', // Amber-700
            borderRadius: 4
          }
        ]
      };
    } 
    else if (this.selectedPeriod === 'month') {
      this.chartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Weekly Sales',
            data: [1200000, 1850000, 1400000, 2100000],
            backgroundColor: '#b45309',      // Amber-700 Theme (Slightly Darker Accent)
            hoverBackgroundColor: '#92400e', // Amber-800
            borderRadius: 4
          }
        ]
      };
    } 
    else if (this.selectedPeriod === 'year') {
      this.chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Monthly Revenue',
            data: [4500000, 5200000, 6100000, 4800000, 5500000, 6900000, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#78716c',      // Stone-500 Theme (Clean Professional Neutral)
            hoverBackgroundColor: '#57534e', // Stone-600
            borderRadius: 4
          }
        ]
      };
    }

    this.isLoading = false;
  }
}
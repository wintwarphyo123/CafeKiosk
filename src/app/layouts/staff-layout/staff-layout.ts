import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from '../../cores/services/user';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrderNotificationService } from '../../cores/services/order-notification-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-staff-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    CommonModule
  ],
  providers: [MessageService],
  templateUrl: './staff-layout.html',
  styleUrl: './staff-layout.scss',
})
export class StaffLayout implements OnInit {

  userProfile: any = null;
  isProfileOpen: boolean = false;
  searchText: string = '';
  notificationCount: number = 0;
  private destroy$ = new Subject<void>();
  isloading: boolean = true;
  isMobileMenuOpen: boolean = false;
  

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private orderNotificationService: OrderNotificationService,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.isloading = true;
    this.userService.userProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isloading = false;
        if (res.success) {

            this.userProfile = res.data;
            this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.messageService.add({
          key: 'globalMessage',
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user profile.'
        });
        this.onLogout();
        this.cdr.detectChanges();
      }
    });
    this.orderNotificationService.notificationCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.notificationCount = count;
        this.cdr.detectChanges();
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
  }
  clearNotifications() {
    this.orderNotificationService.clearNotifications();
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
  onSearch() {
    this.router.navigate(['/staff/kitchen-dashboard'], {
      queryParams: { search: this.searchText },
      queryParamsHandling: 'merge'
    });
  }
  changeStatus(status: string) {
    this.onFilterChange();
  }

  onFilterChange() {
    this.router.navigate(['/staff/kitchen-dashboard'], {
      queryParams: {
        search: this.searchText.trim(),
      },
      queryParamsHandling: 'merge'
    });
  }
}

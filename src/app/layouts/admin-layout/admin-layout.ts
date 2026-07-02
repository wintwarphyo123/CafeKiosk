import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { UserService } from '../../cores/services/user';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { OrderNotificationService } from '../../cores/services/order-notification-service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  providers: [MessageService],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  userProfile: any = null;
  isProfileOpen: boolean = false;
  isMobileMenuOpen: boolean = false;
  isloading:boolean=true;
  notificationCount: number = 0; // Managed by subscription stream
  
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private orderNotificationService: OrderNotificationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Fetch User Profile
    this.isloading = true;
    this.userService.userProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isloading = false;
        if (res.success) {
          this.userProfile = res.data;
        }
        this.cdr.detectChanges();
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

    // Subscribe to real-time notification count stream
    this.orderNotificationService.notificationCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.notificationCount = count;
        this.cdr.detectChanges();
      });
  }
//signal
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
}
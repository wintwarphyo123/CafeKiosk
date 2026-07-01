import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { UserService } from '../../cores/services/user';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-layout',
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
export class AdminLayout implements OnInit {
  userProfile: any = null;
  isProfileOpen: boolean = false;
  isMobileMenuOpen: boolean = false;
  notificationCount: number = 0;
  

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.userService.userProfile().subscribe({
      next: (res) => {
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
    })
  }

  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
    
  }

  onLogout() {
    localStorage.removeItem('token'); 
    this.router.navigate(['/login']); 
  }
}

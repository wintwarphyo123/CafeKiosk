import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from '../../cores/services/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './staff-layout.html',
  styleUrl: './staff-layout.scss',
})
export class StaffLayout implements OnInit {

  userProfile: any = null;
  isProfileOpen: boolean = false;
  searchText: string = '';
  
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

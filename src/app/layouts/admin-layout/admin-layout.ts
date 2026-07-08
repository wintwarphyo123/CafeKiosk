import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { UserService } from '../../cores/services/user';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { OrderNotificationService } from '../../cores/services/order-notification-service';
import { DialogModule } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import {  ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from "primeng/toast";

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    DialogModule,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule
],
  providers: [MessageService,ConfirmationService],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  @ViewChild('image') image!: ElementRef<HTMLInputElement>;
  @ViewChild('imgV') imgV!: ElementRef<HTMLInputElement>;

  imgName: string = '';
  imgBase64String: string = '';
  imgSrc: String = '';
  thumbnailUrl: string = '/thumbnail.jpg';
  userProfile: any = null;
  isProfileOpen: boolean = false;
  isMobileMenuOpen: boolean = false;
  isloading: boolean = true;
  notificationCount: number = 0;
  openUserDialog: boolean = false;

  modelVisible: boolean = false;

  private destroy$ = new Subject<void>();

  private formBuilder = inject(FormBuilder);

  public userForm: FormGroup = this.formBuilder.group({
    userId: [''],
    userName: ['', [Validators.required]],
    status: [true],
    password: [''],
    email: ['', [Validators.email]],
    role: ['', [Validators.required]],
    joinDate: [new Date().toISOString().slice(0, 10)],
    phoneNumber: [''],
    profileImage: ['']
  });

  constructor(
    private userService: UserService,
    private orderNotificationService: OrderNotificationService,
    private messageService: MessageService,
    private confirmationService:ConfirmationService,
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
  handleImageError(event: any) {
    event.target.src = '/thumbnail.jpg';
  }

  public getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const base = environment.web_url.replace(/\/$/, '');
    const path = imagePath.replace(/^\//, '');

    if (path.startsWith('images/')) {
      return `${base}/${path}`;
    }
    return `${base}/images/user/${path}`;
  }

  onUploadImg(): void {
    this.image.nativeElement.click();
  }

  onImgChange(event: any): void {
    if (this.image.nativeElement.value == '') {
      this.imgName = 'None';
      return;
    }

    if (this.checkValidExtension(this.image)) {
      const reader = new FileReader();
      this.imgName = this.image.nativeElement.value;
      const file: File = event.target.files[0];

      if (file) {
        this.userService.convertBase64(file).subscribe((base64) => {
          this.imgBase64String = base64;
          this.userForm.controls['profileImage'].setValue(base64);
        });

        reader.readAsDataURL(file);
        reader.onload = () => {
          this.imgSrc = reader.result as string;
          this.cdr.detectChanges();
        };
      }
    }
  }

  resetImageFields() {
    this.imgBase64String = '';
    this.imgSrc = '';
    this.imgName = '';
    if (this.image && this.image.nativeElement) {
      this.image.nativeElement.value = '';
    }
  }

  checkValidExtension(sender: ElementRef<HTMLInputElement>): boolean {
    let validExs: string[] = ['.jpg', '.png', '.jpeg'];
    let fileExt = sender.nativeElement.value;
    fileExt = fileExt.substring(sender.nativeElement.value.toString().lastIndexOf('.'));
    if (validExs.indexOf(fileExt) < 0) {
      this.messageService.add({
        key: 'globalMobileMessage',
        severity: 'warn',
        summary: 'Warning',
        detail: "Please choose valid files. [Accepted file: Image]"
      });
      sender.nativeElement.value = '';
      return false;
    }
    return true;
  }//for dialog manage user profile
  displayUserDialog() {
    if (this.userProfile) {
      this.userForm.patchValue({
        userId: this.userProfile.userId || this.userProfile.id || '',
        userName: this.userProfile.userName || '',
        email: this.userProfile.email || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        role: this.userProfile.role || '',
        status: this.userProfile.status !== undefined ? this.userProfile.status : true,
        password: ''
      });

      if (this.userProfile.profileImage) {
        this.imgSrc = this.getImageUrl(this.userProfile.profileImage);
        this.imgName = this.userProfile.profileImage.split('/').pop() || '';
      } else {
        this.resetImageFields();
      }
    }

    this.modelVisible = true;
  }

  submit() {
    if (this.userForm.valid) {
      console.log('Updated Profile Data Payload:', this.userForm.value);

      // Call your save service here, for example:
      // this.userService.updateProfile(this.userForm.value).subscribe(res => { ... })

      this.modelVisible = false; // close modal on success
    }
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
  this.confirmationService.confirm({
    message: 'Are you sure you want to sign out of your account?',
    header: 'Sign Out Confirmation',
    icon: 'pi pi-sign-out text-amber-700', 
    accept: () => {
      
      localStorage.removeItem('token');
      //localStorage.removeItem('userRole'); 
      
      this.router.navigate(['/login']);
      
      this.messageService.add({
        key: 'globalMessage',
        severity: 'success',
        summary: 'Signed Out',
        detail: 'You have been logged out successfully.'
      });
    },
    reject: () => {
      console.log('Logout cancelled by user.');
    }
  });
}
}
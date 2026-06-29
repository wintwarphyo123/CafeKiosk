import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../cores/services/user';
import { LoginModel, UserModel } from '../../cores/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext'; // InputText Component အတွက် ထည့်သွင်းရန်

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ReactiveFormsModule,
    InputTextModule 
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  isloading: boolean = false;
  userModel: UserModel[] = [];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  private formbuilder = inject(FormBuilder);
  
  public userForm: FormGroup = this.formbuilder.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  ngOnInit(): void { }

  onSubmit() {
  
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isloading = true;
    this.cdr.detectChanges();
    const formValue = this.userForm.getRawValue();

    const userData: LoginModel = {
      userName: formValue.userName,
      password: formValue.password,
      role: null
    };

    this.userService.login(userData).subscribe({
      next: (res) => {
        if (res.success) {
          const token = res.data;

          if (!token) {
            this.isloading = false;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'warn',
              summary: 'Warning',
              detail: 'Login succeeded but no JWT token was returned.'
            });
            this.cdr.detectChanges();
            return;
          }

          localStorage.setItem('token', token);
          

          this.userService.userProfile().subscribe({
            next: (profileRes) => {
              this.isloading = false;
              if (profileRes.success) {
                const userRole = profileRes.data?.role ?? profileRes.data?.userRole;
                localStorage.setItem('userRole' ,userRole);
                this.messageService.add({
                  key: 'globalMessage',
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Login Successful! Welcome.'
                });
                this.cdr.detectChanges();

                setTimeout(() => {
                  if (userRole === 'Admin') {
                    this.router.navigate(['/admin/dashboard']);
                  } else if (userRole === 'KitchenStaff' || userRole === 'Kitchen') {
                    this.router.navigate(['/staff/kitchen-dashboard']);
                  } else {
                    this.router.navigate(['/customer-order']);
                  }
                }, 500);
              } else {
                this.messageService.add({
                  key: 'globalMessage',
                  severity: 'error',
                  summary: 'Error',
                  detail: profileRes.message || 'Failed to fetch profile details.'
                });
              }
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.isloading = false;
              this.messageService.add({
                key: 'globalMessage',
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch user profile after authentication.'
              });
              this.cdr.detectChanges();
            }
          });

        } else {
          this.isloading = false;
          this.messageService.add({
            key: 'globalMessage',
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Invalid username or password.'
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isloading = false;
        this.messageService.add({
          key: 'globalMessage',
          severity: 'warn',
          summary: 'Warning',
          detail: err.error?.message || 'Connection failed. Please try again.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
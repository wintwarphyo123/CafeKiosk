import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { UserModel } from '../../cores/models/user.model';
import { SortColumn } from '../../cores/models/root.model';
import { UserService } from '../../cores/services/user';
import { environment } from '../../../environments/environment';
import { ImageModule } from "primeng/image";

@Component({
  selector: 'app-user',
  imports: [
    CommonModule,
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
    SelectModule,
    ImageModule,
  ],
  providers: [ConfirmationService, DatePipe, MessageService],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  @ViewChild('image') image!: ElementRef<HTMLInputElement>;
  @ViewChild('imgV') imgV!: ElementRef<HTMLInputElement>;

  imgName: string = '';
  imgBase64String: string = '';
  imgSrc: String = '';
  thumbnailUrl: string = '/thumbnail.jpg';
  
  userModel: UserModel[] = [];
  modelVisible: boolean = false;
  isLoading: boolean = false;
  isEditMode: boolean = false;
  selectedUser: UserModel | null = null;
  roleOption: string[] = [];
  cols!: SortColumn[];
  errorMessage = signal<any[]>([]);

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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'userName', header: 'UserName' },
      { field: 'email', header: 'Email' },
      { field: 'role', header: 'Role' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'joinDate', header: 'Join Date' }
    ];
    this.roleOption = ['Admin', 'KitchenStaff'];
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.userService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }

        const rawUsers = Array.isArray(res.data) ? res.data : [];
        this.userModel = rawUsers.map((user: any) => {
          const rawDate = user.joinDate || null;
          const formattedDate = rawDate
            ? this.datePipe.transform(rawDate, 'yyyy MMMM dd')
            : '';
            
          return {
            userId: user.userId ?? user.id ?? '',
            userName: user.userName ?? user.username ?? '',
            email: user.email ?? user.mail ?? '',
            password: user.password ?? '',
            status: typeof user.status === 'string' ? user.status === 'true' : Boolean(user.status),
            role: String(user.role ?? user.userRole ?? '').trim(),
            joinDate: formattedDate, 
            phoneNumber: user.phoneNumber ?? '',
            profileImage: user.profileImage ? this.getImageUrl(user.profileImage) : null,
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = '/thumbnail.jpg';
  }

  private getImageUrl(imagePath: string): string {
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
  }

  create(): void {
    this.modelVisible = true;
    this.isEditMode = false;
    this.resetImageFields();
    this.userForm.reset({
      userId: '',
      userName: '',
      password: '',
      status: true,
      email: '',
      phoneNumber: '',
      joinDate: new Date().toISOString().slice(0, 10),
      profileImage: '',
      role: ''
    });
    this.cdr.detectChanges();
  }

  update(user: UserModel): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.userForm.reset();
    
    let safeFormDate = new Date().toISOString().slice(0, 10);
    if (user.joinDate) {
      const parsedDate = new Date(user.joinDate);
      if (!isNaN(parsedDate.getTime())) {
        safeFormDate = this.datePipe.transform(parsedDate, 'yyyy-MM-dd') || safeFormDate;
      }
    }

    this.userForm.patchValue({
      userId: user.userId ?? '',
      userName: user.userName ?? '',
      password: '',
      email: user.email ?? '',
      phoneNumber: user.phoneNumber ?? '',
      status: user.status ?? true,
      joinDate: safeFormDate, 
      profileImage: user.profileImage ?? '',
      role: user.role ?? ''
    });

    if (user.profileImage) {
      this.imgSrc = user.profileImage;
      this.imgName = user.profileImage.substring(user.profileImage.lastIndexOf('/') + 1);
    } else {
      this.imgSrc = '';
      this.imgName = '';
    }
    this.modelVisible = true;
    this.cdr.detectChanges();
  }

  submit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();
    let userData: any = {
      userName: formValue.userName,
      password: formValue.password,
      status: formValue.status,
      joinDate: formValue.joinDate,
      role: formValue.role,
      phoneNumber: formValue.phoneNumber,
      email: formValue.email,
      profileImage: formValue.profileImage
    };

    if (this.isEditMode) {
      userData.userId = this.selectedUser!.userId;
      this.userService.update(this.selectedUser!.userId, userData).subscribe({
        next: (res) => {
          if (res.success) {
            this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'User updated successfully.' });
            this.resetImageFields();
            this.loadData();
            this.modelVisible = false;
            this.selectedUser = null;
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to update user.' });
          }
        },
        error: (err) => {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'An error occurred while updating the user.' });
        },
      });
    } else {
      userData.userId = "";
      this.userService.create(userData).subscribe({
        next: (res) => {
          if (res.success) {
            this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'User created successfully.' });
            this.resetImageFields();
            this.loadData();
            this.modelVisible = false;
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to create user.' });
          }
        },
        error: (err) => {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'An error occurred while creating the user.' });
        },
      });
    }
  }

  delete(user: UserModel): void {
    this.selectedUser = user;
    if (!this.selectedUser) {
      this.messageService.add({ key: 'globalMessage', severity: 'warn', summary: 'No user selected', detail: 'Please select a user to delete.' });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete user "${this.selectedUser.userName}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.delete(this.selectedUser!.userId).subscribe({
          next: (res) => {
            if (res.success) {
              this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'User deleted successfully.' });
              this.loadData();
            } else {
              this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to delete user.' });
            }
          },
          error: (err) => {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'An error occurred while deleting the user.' });
          },
        });
      },
    });
  }

  UserStatus(user: UserModel): void {
    this.isLoading=false;
    this.userService.changeStatus(user.userId).subscribe({
      next: (res) => {
        this.isLoading=false;
        if (res.success) {
          user.status = !user.status; 
          this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'User status updated successfully.' });
          this.loadData();
        } else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to update user status.' });
        }
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'An error occurred while updating user status.' });
      },
    });
  }
}
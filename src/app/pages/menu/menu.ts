import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { MenuModel } from '../../cores/models/menu.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MenuService } from '../../cores/services/menu';
import { environment } from '../../../environments/environment';

import { SortColumn } from '../../cores/models/root.model';
import { Router } from '@angular/router';
import { AllCategoryForDropDown } from '../../cores/models/menu-detail.model';

@Component({
  selector: 'app-menu',
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
    ImageModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>; // Fixed Template reference variable name

  imgName: string = '';
  imgBase64String: string = '';
  imgSrc: String = '';
  thumbnailUrl: string = '/thumbnail.jpg';
  userRole: string = '';

  menuModel: MenuModel[] = [];
  selectedMenu: MenuModel | null = null;
  isLoading: boolean = false;
  modalVisible: boolean = false;
  isEdited: boolean = false;
  allCategories: any[] = [];
  cols!: SortColumn[];

  constructor(
    private menuService: MenuService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private router: Router
  ) { }

  private formBuilder = inject(FormBuilder);
  public menuForm: FormGroup = this.formBuilder.group({
    id: [0],
    menuName: [''],
    menuImage: [''],
    description: [''],
    price: [0],
    isAvailable: [true],
    categoryId: [null], 
    categoryName: ['']
  })

  ngOnInit(): void {
    this.cols = [
      { field: 'menuName', header: 'Menu Name' },
      { field: 'price', header: 'Price' },
      { field: 'description', header: 'Description' },
      { field: 'categoryName', header: 'Category Name' }
    ]
    const savedRole = localStorage.getItem('userRole') || '';
    this.userRole = savedRole.toUpperCase(); 
    this.categoryData();
  }

  categoryData(){
    this.isLoading = true;
    this.menuService.getAllCategories().subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Categories API Response:', res);
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load categories.' });
          return;
        }
        
        const rawCategory = Array.isArray(res.data) ? res.data : [];
        
        this.allCategories = rawCategory.map((item: any) => ({
          id: item.categoriesId ?? item.id ?? item.CategoriesId ?? 0,
          name: item.categoriesName ?? item.name ?? item.CategoriesName ?? ''
        }));

        this.cdr.detectChanges();
       
        this.loadData();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadData(); 
        this.cdr.detectChanges();
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.menuService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Menu List API Response:', res);
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        const rawMenu = Array.isArray(res.data) ? res.data : [];
        this.menuModel = rawMenu.map((item) => ({
          menuId: item.Id ?? item.menuId ?? item.id ?? 0,
          menuName: item.menuName ?? '',
          menuImage: item.menuImage ? this.getImageUrl(item.menuImage) : null,
          description: item.description ?? '',
          price: item.price ?? 0,
          isAvailable: item.isAvailable ?? item.is_available ?? true,
          categoryId: item.categoryId ?? 0,
          categoryName: item.categoryName ?? ''
        }));

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    })
  }

  handleImageError(event: any) {
    event.target.src = this.thumbnailUrl;
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

    return `${base}/images/menu/${path}`;
  }

  onUploadImg(): void {
    this.imageInput.nativeElement.click();
  }

  onImgChange(event: any): void {
    if (this.imageInput.nativeElement.value == '') {
      this.imgName = 'None';
      return;
    }

    if (this.checkValidExtension(this.imageInput)) {
      const reader = new FileReader();
      this.imgName = this.imageInput.nativeElement.value.split('\\').pop() || '';
      const file: File = event.target.files[0];
      if (file) {
        this.menuService.convertBase64(file).subscribe((base64) => {
          this.imgBase64String = base64;
          this.menuForm.controls['menuImage'].setValue(base64);
        })

        reader.readAsDataURL(file);
        reader.onload = () => {
          this.imgSrc = reader.result as string;
          this.cdr.detectChanges();
        }
      }
    }
  }

  resetImageFields() {
    this.imgBase64String = '';
    this.imgSrc = '';
    this.imgName = '';
    if (this.imageInput && this.imageInput.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  checkValidExtension(sender: ElementRef<HTMLInputElement>): boolean {
    let validExs: string[] = ['.jpg', '.png', '.jpeg'];
    let fileExt = sender.nativeElement.value;
    fileExt = fileExt.substring(sender.nativeElement.value.toString().lastIndexOf('.')).toLowerCase();
    if (validExs.indexOf(fileExt) < 0) {
      this.messageService.add({
        key: 'globalMessage',
        severity: 'warn',
        summary: 'Warning',
        detail: "Please choose valid files. [Accepted file: Image]"
      });
      sender.nativeElement.value = '';
      return false;
    }
    else return true;
  }

  submit() {
    const formValue = this.menuForm.getRawValue();
    let menuData: any;
    
    if (this.isEdited) {
      const currentMenuId = this.selectedMenu?.menuId ?? 0;
      menuData = {
        menuId: currentMenuId,
        menuName: formValue.menuName,
        menuImage: formValue.menuImage,
        price: Number(formValue.price),
        description: formValue.description,
        isAvailable: formValue.isAvailable === 'true' || formValue.isAvailable === true,
        categoryId: Number(formValue.categoryId)
      }
      this.menuService.update(currentMenuId, menuData).subscribe({
        next: (res) => {
          if (res.success) {
            this.modalVisible = false;
            this.resetImageFields();
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Success',
              detail: 'Menu Updated Successfully'
            });
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
          }
          this.selectedMenu = null;
        },
        error: (err) => {
          this.modalVisible = false;
          this.loadData();
          this.messageService.add({ key: 'globalMessage', severity: 'warn', summary: 'Warning', detail: 'Menu Update Failed' });
        }
      })
    } else {
      menuData = {
        menuId: 0,
        menuName: formValue.menuName,
        menuImage: formValue.menuImage,
        price: Number(formValue.price),
        description: formValue.description,
        isAvailable: formValue.isAvailable === 'true' || formValue.isAvailable === true,
        categoryId: Number(formValue.categoryId)
      }
      this.menuService.create(menuData).subscribe({
        next: (res) => {
          if (res.success) {
            this.modalVisible = false;
            this.resetImageFields();
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Success',
              detail: 'Menu Created Successfully'
            });
          } else {
            this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.modalVisible = false;
          this.loadData();
          this.messageService.add({ key: 'globalMessage', severity: 'warn', summary: 'Warning', detail: 'Menu Create Failed' });
        }
      })
    }
  }

  create() {
    this.menuForm.reset({
      id: 0,
      menuName: '',
      menuImage: '',
      description: '',
      price: 0,
      isAvailable: true,
      categoryId: null,
      categoryName: ''
    });
    this.resetImageFields();
    this.modalVisible = true;
    this.isEdited = false;
  }

  update(menu: MenuModel) {
    this.menuForm.reset();
    this.resetImageFields();
    this.modalVisible = true;
    this.isEdited = true;
    this.selectedMenu = menu;
    
    // FIX: Match exact keys assigned on your FormGroup properties!
    this.menuForm.patchValue({
      id: menu.menuId ?? 0,
      menuName: menu.menuName ?? '',
      menuImage: menu.menuImage ?? '',
      price: menu.price ?? 0,
      description: menu.description ?? '',
      isAvailable: menu.isAvailable ?? true,
      categoryId: menu.categoryId ?? null
    });

    if (menu.menuImage) {
      this.imgSrc = menu.menuImage;
      this.imgName = menu.menuImage.substring(menu.menuImage.lastIndexOf('/') + 1);
    } else {
      this.imgSrc = '';
      this.imgName = '';
    }
  }

  delete(menu: MenuModel): void {
    this.selectedMenu = menu;
    this.confirmationService.confirm({
      message: 'Are you sure want to delete?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.menuService.delete(menu.menuId).subscribe({
          next: (res) => {
            this.loadData();
            this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: 'Menu deleted Successfully' });
          },
          error: (err) => {
            this.messageService.add({ key: 'globalMessage', severity: 'warn', summary: 'Warning', detail: 'Menu delete Failed' });
          }
        });
      }
    });
  }

  viewDetail(rowData: any) {
    this.router.navigate(['/admin/menu/detail', rowData.menuId]);
  }

  toggleMenuAvailability(item: any) {
    this.isLoading = true;
    this.menuService.changeStatus(item.menuId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          item.isAvailable = !item.isAvailable;
          this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'Status Updated' });
        } else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Failed', detail: 'Status change failed' });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Something went wrong' });
      }
    })
  }
}
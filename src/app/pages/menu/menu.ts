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
import { CategoryModel } from '../../cores/models/category.model';
import { SortColumn } from '../../cores/models/root.model';

@Component({
  selector: 'app-menu',
  imports: [CommonModule,
    FormsModule,
    ToastModule,
    ReactiveFormsModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    TableModule,
    ConfirmDialogModule,
    InputTextModule,
    ToastModule,
    DialogModule,
    SelectModule,
    ImageModule],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {
  @ViewChild('image') image!: ElementRef<HTMLInputElement>;
  @ViewChild('imgV') imgV!: ElementRef<HTMLInputElement>;

  imgName: string = '';

  imgBase64String: string = '';

  imgSrc: String = '';

  thumbnailUrl: string = '/thumbnail.jpg';

  menuModel: MenuModel[] = [];
  selectedMenu: MenuModel | null = null;
  isLoading: boolean = false;
  modalVisible: boolean = false;
  isEdited: boolean = false;
  optionCategory: { label: string | null, value: number | null}[] = [];
  cols!: SortColumn[];

  constructor(
    private menuService: MenuService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { }
  //menuId,menuName,menuImage,description,price,isAvailable,categoryId,categoryName
  private formBuilder = inject(FormBuilder);
  public menuForm: FormGroup = this.formBuilder.group({
    id: [0],
    menuName: [''],
    menuImage: [''],
    description: [''],
    price: [0],
    isAvailable: [true],
    categoryId: [0],
    categoryName: ['']
  })


  ngOnInit(): void {
    this.cols = [
      { field: 'menuName', header: 'Menu Name' },
      { field: 'price', header: 'Price' },
      { field: 'description', header: 'Description' },
      { field: 'categoryName', header: 'Category Name' }
    ]
    this.loadData();
  }
  loadData() {
    this.isLoading = true;
    this.menuService.get().subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('API Response:', res);
        if (!res.success) {
          this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        const rawMenu = Array.isArray(res.data) ? res.data : [];
        this.menuModel = rawMenu.map((item) => ({
          menuId: item.Id ?? item.menuId?? item.id??  0,
          menuName: item.menuName ?? '',
          //item.categorye ? this.getImageUrl(item.categoryImage) : null,
          menuImage: item.menuImage ? this.getImageUrl(item.menuImage) : null,
          description: item.description ?? '',
          price: item.price ?? 0,
          isAvailable: item.is_available ?? '',
          categoryId: item.categoryId ?? 0,
          categoryName: item.categoryName ?? ''
        }));

        const seen = new Set<number>();
        this.optionCategory = this.menuModel
          .map(cat => ({
            label: cat.categoryName, 
            value: cat.categoryId     
          }))
          .filter(item => {
            if (!item.value || seen.has(item.value)) {
              return false;
            }
            seen.add(item.value);
            return true;
          });

        this.cdr.detectChanges();
        console.log(this.menuModel);
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    })
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

    return `${base}/images/menu/${path}`;
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
        this.menuService.convertBase64(file).subscribe((base64) => {
          this.imgBase64String = base64;
          this.menuForm.controls['menuImage'].setValue(base64);
          console.log(this.imgBase64String);
        })

        /* Show Image */
        reader.readAsDataURL(file);
        reader.onload = () => {
          console.log(reader.result);
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
        isAvailable: formValue.isAvailable==='true' || formValue.isAvailable === true,
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
              summary: 'success',
              detail: 'Category Update Successfully'
            });
          }
          else {
            this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message });

          }
        },
        error: (err) => {
          this.modalVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'Category Update Failed'
          });
        },
        complete: () => { },
      })
    }
    else {
      menuData = {
        menuId: 0,
        menuName: formValue.menuName,
        menuImage: formValue.menuImage,
        price: Number(formValue.price),
        description: formValue.description,
        isAvailable: formValue.isAvailable==='true' || formValue.isAvailable === true,
        categoryId:Number(formValue.categoryId)
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
              summary: 'success',
              detail: 'Category Create Successfully'
            });
          } else {
            this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.modalVisible = false;
          this.loadData();
          this.messageService.add({
            key: 'globalMessage',
            severity: 'warn',
            summary: 'Warning',
            detail: 'Category Create Fail'
          });
        },
        complete: () => { },
      })
    }

  }

  create() {
    this.menuForm.reset();
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
    this.menuForm.patchValue({
      menuId: menu.menuId ?? 0,
      menuName: menu.menuName ?? '',
      menuImage: menu.menuImage ?? '',
      price: menu.price ?? 0,
      description: menu.description ?? '',
      is_available: menu.isAvailable ?? true,
      categoryId:menu.categoryId
    });
    if (menu.menuImage) {
      this.imgSrc = menu.menuImage; // ဇယားထဲက ရရှိထားပြီးသား Image URL ကို ထည့်ပေးလိုက်တာပါ

      // URL လမ်းကြောင်းထဲကနေ ဖိုင်နာမည်တစ်ခုပဲ ဖြတ်ယူပြချင်ရင် (မပြချင်လည်း ရပါတယ်)
      this.imgName = menu.menuImage.substring(menu.menuImage.lastIndexOf('/') + 1);
    } else {
      this.imgSrc = '';
      this.imgName = '';
    }

    console.log(this.menuForm);
    this.modalVisible = true;

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
            this.modalVisible = false;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'success',
              detail: 'Category delete Successfully'
            });
          },
          error: (err) => {
            this.modalVisible = false;
            this.messageService.add({
              key: 'globalMessage',
              severity: 'warn',
              summary: 'Warning',
              detail: 'Category delete Failed'
            });
          }
        });
      }
    });
  }

}

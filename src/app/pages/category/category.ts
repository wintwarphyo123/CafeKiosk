import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { CategoryModel } from '../../cores/models/category.model';
import { CategoryService } from '../../cores/services/category';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ImageModule } from "primeng/image";
import { SelectModule } from 'primeng/select';
import { isActive } from '@angular/router';
import { SortColumn } from '../../cores/models/root.model';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-category',
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
    ToastModule,
    DialogModule,
    SelectModule,
    ImageModule,
    ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class Category implements OnInit {
  @ViewChild('image') image!: ElementRef<HTMLInputElement>;
  @ViewChild('imgV') imgV!: ElementRef<HTMLInputElement>;


  imgName: string = '';

  imgBase64String: string = '';

  imgSrc: String = '';

  thumbnailUrl: string = '/thumbnail.jpg';

  categoryModel: CategoryModel[] = [];
  selectedCategory: CategoryModel | null = null;
  modalVisible: boolean = false;
  isLoading: boolean = false;
  isEdit: boolean = false;
  errorMessage = signal<any[]>([]);
cols!:SortColumn[];
  constructor(
    //private route: ActivatedRoute,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    //private datePipe: DatePipe,
    private confirmationService: ConfirmationService
  ) { }

  private formBuilder = inject(FormBuilder)
  public categoryForm: FormGroup = this.formBuilder.group({
    categoryId: [0],
    categoryName: [''],
    isActive: [true],
    categoryImage: ['']
    
  })

  ngOnInit(): void {
    this.cols=[
      {field:'categoryName',header:'category Name'}
    ]
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.categoryService.get().subscribe({
      next: (res) => {//categoryId,categoryName,isActive,categoryImage,createdAt,updatedAt,deletedAt
        this.isLoading = false;
        if (!res.success) {
          this.messageService.add({key:'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        const rawCategory = Array.isArray(res.data) ? res.data : [];

        this.categoryModel = rawCategory.map((item) => ({
          categoryId: item.id ?? item.categoryId ?? item.categoryid ?? 0,
          categoryName: item.categoryName ?? null,
          isActive: item.active===1 || item.isActive === 'true' || item.isActive===true,
          categoryImage: item.categoryImage ? this.getImageUrl(item.categoryImage) : null,
        }));

        this.cdr.detectChanges();
        console.log('categoryModel', this.categoryModel);

        console.log('categoryImage URLs', this.categoryModel.map((item) => item.categoryImage));
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

    return `${base}/images/category/${path}`;
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
        this.categoryService.convertBase64(file).subscribe((base64) => {
          this.imgBase64String = base64;
          this.categoryForm.controls['categoryImage'].setValue(base64);
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


  create(): void {
    this.categoryForm.reset();
    this.resetImageFields();
    this.modalVisible = true;
    this.isEdit = false;
  }

  update(category: CategoryModel) {
    this.isEdit = true;
    this.selectedCategory = category;
    this.categoryForm.reset();
    this.categoryForm.patchValue({
      categoryId: category.categoryId ?? 0,
      categoryName: category.categoryName ?? '',
      categoryImage: category.categoryImage ?? '',
      isActive: category.isActive ?? ''
    });
    if (category.categoryImage) {
      this.imgSrc = category.categoryImage; // ဇယားထဲက ရရှိထားပြီးသား Image URL ကို ထည့်ပေးလိုက်တာပါ
      
      // URL လမ်းကြောင်းထဲကနေ ဖိုင်နာမည်တစ်ခုပဲ ဖြတ်ယူပြချင်ရင် (မပြချင်လည်း ရပါတယ်)
      this.imgName = category.categoryImage.substring(category.categoryImage.lastIndexOf('/') + 1);
    } else {
      this.imgSrc = '';
      this.imgName = '';
    }

    console.log(this.categoryForm);
    this.modalVisible = true;
  }
  

  submit() {

    const formValue = this.categoryForm.getRawValue();
    let categoryData: any;
    if (!this.isEdit) {
      categoryData = {
        categoryId: 0,
        categoryName: formValue.categoryName,
        categoryImage: formValue.categoryImage
      }
      this.categoryService.create(categoryData).subscribe({
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
      });
    }
    else {
      categoryData = {
        categoryId: this.selectedCategory?.categoryId,
        categoryName: formValue.categoryName,
        categoryImage: formValue.categoryImage
      }
      this.categoryService.update(categoryData.categoryId, categoryData).subscribe({
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
          } else {
            this.messageService.add({ key:'globalMessage',severity: 'error', summary: 'Error', detail: res.message });
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
  }

  delete(category: CategoryModel): void {
    this.selectedCategory = category;
    this.confirmationService.confirm({
      message: 'Are you sure want to delete?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryService.delete(category.categoryId).subscribe({
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
  resetImageFields() {
    this.imgBase64String = '';
    this.imgSrc = '';
    this.imgName = '';
    if (this.image && this.image.nativeElement) {
      this.image.nativeElement.value = '';
    }
  }
}

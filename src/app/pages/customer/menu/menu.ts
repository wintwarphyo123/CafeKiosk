import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { CategoryModel } from '../../../cores/models/category.model';
import { CategoryService } from '../../../cores/services/category';
import { environment } from '../../../../environments/environment';
import { MenuModel } from '../../../cores/models/menu.model';
import { MenuService } from '../../../cores/services/menu';

interface OptionItem {
  id: number;
  itemName: string;
  extraPrice: number;
  optionGroupId: number;
  groupName: string;
}

interface GroupedOptions {
  groupName: string;
  items: OptionItem[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
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
    RadioButtonModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss']
})
export class MenuComponent implements OnInit {

  sidebarVisible: boolean = false;
  cartCount: number = 0;
  isloading: boolean = false;
  quantity:number=1;

  displayDetail: boolean = false;
  selectedItem: any = null;
  groupedOptions: GroupedOptions[] = [];
  selectedOptions: { [key: string]: OptionItem } = {};
  totalExtraPrice: number = 0;
  

  categoryModel: CategoryModel[] = [];//category for task bar
  selectedCategoryId: number | null = null;
  menuModel: MenuModel[] = [];
  filterMenuItem: any[] = [];
  allOptionGroupList:any[]=[];


  constructor(
    private categoryService: CategoryService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadCategory();
  }

  loadCategory(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success) {
          const rawCategory = Array.isArray(res.data) ? res.data : [];

          this.categoryModel = rawCategory
            .filter((c: any) => c.active === 1 || c.isActive === 'true' || c.isActive === true)
            .map((item: any) => ({
              categoryId: item.id ?? item.categoryId ?? item.categoryid ?? 0,
              categoryName: item.categoryName ?? null,
              isActive: true,
              categoryImage: item.categoryImage ? this.getImageUrl(item.categoryImage) : null
            }));
            this.getMenuDetailOption();
        }
        else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load category.' });
          this.getMenuDetailOption();
        }
        this.cdr.detectChanges();
        console.log(this.categoryModel);
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load category.' });
        
      }
    })
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

  getMenuDetailOption():void{
    this.menuService.getAllOptionGroups().subscribe({
      next:(res)=>{
        this.allOptionGroupList=res.data ? res.data:(Array.isArray(res)?res:[]);
        this.loadMenu();
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load category.' });
        this.loadMenu();
      }
    })
  }

  loadMenu(): void {
    this.isloading = true;
    this.menuService.get().subscribe({
      next: (res) => {
        this.isloading= false;
        console.log('API Response:', res);
        if (!res.success) {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load users.' });
          return;
        }
        const rawMenu = Array.isArray(res.data) ? res.data : [];
        this.menuModel = rawMenu.map((item) => ({
          menuId: item.Id ?? item.menuId ?? item.id ?? 0,
          menuName: item.menuName ?? '',
          //item.categorye ? this.getImageUrl(item.categoryImage) : null,
          menuImage: item.menuImage ? this.getImageUrl(item.menuImage) : null,
          description: item.description ?? '',
          price: item.price ?? 0,
          isAvailable: item.is_available ?? '',
          categoryId: item.categoryId ?? 0,
          categoryName: item.categoryName ?? ''
        }));
        this.filterMenuByCategory();

        this.cdr.detectChanges();
        console.log(this.menuModel);
      },
      error: (err) => {
        this.isloading = false;
        this.cdr.detectChanges();
      }
    })
  }
  selectCategory(categoryId: number| null): void {
    this.selectedCategoryId = categoryId;
    this.filterMenuByCategory();
  }

  filterMenuByCategory(): void {
    if (this.selectedCategoryId !== null) {
      this.filterMenuItem = this.menuModel.filter(
        item => item.categoryId === this.selectedCategoryId && item.isAvailable
      );
    } else {
      this.filterMenuItem = this.menuModel.filter(item => item.isAvailable);
    }
    this.cdr.detectChanges();
  }

  openDetail(item: any) {
    if (!item || !item.menuId) {
      console.error("Cannot open detail: menuId is missing", item);
      return;
    }
    this.selectedItem = item;
    this.selectedOptions = {};
    this.totalExtraPrice = 0;
    this.quantity=1;
    this.groupedOptions=[];
    this.menuService.getMenudetail(item.menuId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const linkedGroup=res.data.optionGroups || [];
          const linkedGroupIds=linkedGroup.map((g:any)=>Number(g.groupId || g.id));
          this.groupedOptions =this.allOptionGroupList.filter(group=>group && linkedGroupIds.includes(Number(group.groupId || group.id))
          ).map(group => ({
            groupId: group.groupId || group.id,
            groupName: group.groupName || group.name,
            items: group.items || group.options ||group.optionItems || []
          }));
          this.groupedOptions.forEach(group => {
            if (group.items.length > 0) {
              this.selectedOptions[group.groupName] = group.items[0];
            }
          });

          this.calculateTotalPrice();
          this.displayDetail = true;
        }
        this.cdr.detectChanges();
      },
      error:(err)=>{
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load category.' });
        this.cdr.detectChanges();
      }
    })
  }

  incrementQuantity(){
    this.quantity++;
  }
  decrementQuantity(){
    if(this.quantity>1){
      this.quantity--;
    }   
  }

  calculateTotalPrice() {
    this.totalExtraPrice = 0;
    Object.keys(this.selectedOptions).forEach(key => {
      this.totalExtraPrice += this.selectedOptions[key].extraPrice;
    });
  }

  confirmAddToCart() {
    this.cartCount +=this.quantity;
    const finalPrice = this.selectedItem.price + this.totalExtraPrice;
    console.log('Ordered Item:', this.selectedItem.menuName);
    console.log('Selected Customizations:', this.selectedOptions);
    console.log('Final Price:', finalPrice);
    this.displayDetail = false;
  }
}
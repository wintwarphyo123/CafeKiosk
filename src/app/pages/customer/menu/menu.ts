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
import { MenuService } from '../../../cores/services/menu';
import { OrderService } from '../../../cores/services/order';
import { ConfirmPaymentRequest, OrderRequest } from '../../../cores/models/order-detail.model';

import { ActivatedRoute, Router } from '@angular/router';

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
  cartVisible: boolean = false;
  orderSubtotal: number = 1;

  sidebarVisible: boolean = false;
  cartCount: number = 0;
  isloading: boolean = false;
  displayDialogPhone: boolean = false;
  displayPaymentDialog: boolean = false;
  customerPhone: string = '';
  transitionNote: string = '';
  quantity: number = 1;
  pendingOrderPayload: any = null;
  searchQuery:string='';

  displayDetail: boolean = false;
  selectedItem: any = null;
  groupedOptions: GroupedOptions[] = [];
  selectedOptions: { [key: string]: OptionItem } = {};
  totalExtraPrice: number = 0;

  categoryModel: CategoryModel[] = [];//category for task bar
  orderModel: OrderRequest[] = [];
  confirmPayment: ConfirmPaymentRequest[] = [];
  selectedCategoryId: number | null = null;
  menuModel: any[] = [];
  filterMenuItem: any[] = [];
  allOptionGroupList: any[] = [];
  cartItems: any[] = [];
  orderCount: number = 0;
  

  constructor(
    private categoryService: CategoryService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private messageService: MessageService,
    private orderService: OrderService,
    //private notificationService: NotificationService
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

  getMenuDetailOption(): void {
    this.menuService.getAllOptionGroups().subscribe({
      next: (res) => {
        this.allOptionGroupList = res.data ? res.data : (Array.isArray(res) ? res : []);
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
        this.isloading = false;
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
  selectCategory(categoryId: number | null): void {
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
    this.quantity = 1;
    this.groupedOptions = [];
    this.menuService.getMenudetail(item.menuId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const linkedGroup = res.data.optionGroups || [];
          const linkedGroupIds = linkedGroup.map((g: any) => Number(g.groupId || g.id));
          this.groupedOptions = this.allOptionGroupList.filter(group => group && linkedGroupIds.includes(Number(group.groupId || group.id))
          ).map(group => ({
            groupId: group.groupId || group.id,
            groupName: group.groupName || group.name,
            items: group.items || group.options || group.optionItems || []
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
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load category.' });
        this.cdr.detectChanges();
      }
    })
  }

  incrementQuantity() {
    this.quantity++;
  }
  decrementQuantity() {
    if (this.quantity > 1) {
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

    if (!this.selectedItem) {

    }

    this.cartCount += this.quantity;
    const finalPrice = this.selectedItem.price + this.totalExtraPrice;
    const selectedOptionsClone = JSON.parse(JSON.stringify(this.selectedOptions));

    const existingItem = this.cartItems.findIndex(item => {
      return item.menuId === this.selectedItem.menuId && JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptionsClone);
    });
    if (existingItem > -1) {
      this.cartItems[existingItem].quantity += this.quantity;
      this.cartItems[existingItem].calculatedprice = this.cartItems[existingItem].quantity * finalPrice;
    } else {
      this.cartItems.push({
        menuId: this.selectedItem.menuId,
        menuName: this.selectedItem.menuName,
        basePrice: this.selectedItem.price,
        selectedOptions: selectedOptionsClone,
        quantity: this.quantity,
        singleTotalPrice: finalPrice,
        calculatedPrice: finalPrice * this.quantity
      });
    }
    this.calculateCartTotalPrice();
    this.messageService.add({
      key: 'globalMessage',
      severity: 'success',
      summary: 'Added to Cart',
      detail: 'successfully added'
    });

    console.log('Ordered Item:', this.selectedItem.menuName);
    console.log('Selected Customizations:', this.selectedOptions);
    console.log('Final Price:', finalPrice);
    this.displayDetail = false;
  }

  calculateCartTotalPrice() {
    this.cartCount = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
    this.orderSubtotal = this.cartItems.reduce((acc, item) => acc + item.calculatedPrice, 0);

    this.cdr.detectChanges();
  }
  removeCartItem(index: number) {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems.splice(index, 1);
      this.calculateCartTotalPrice();
    }
  }
  updateCartQty(index: number, change: number) {
    if (index < 0 || index >= this.cartItems.length) return;

    this.cartItems[index].quantity += change;

    if (this.cartItems[index].quantity <= 0) {
      this.removeCartItem(index);
    } else {
      this.cartItems[index].calculatedPrice =
        this.cartItems[index].quantity * this.cartItems[index].singleTotalPrice;
      this.calculateCartTotalPrice();
    }
  }
  clearCart() {
    this.cartItems = [];
    this.calculateCartTotalPrice();
  }

  openPhoneDialog(): void {
    if (this.cartItems.length === 0) {
      return;
    }
    this.displayDialogPhone = true;
  }

  gotoPayment() {
    if (!this.customerPhone || this.customerPhone.trim() === '') {
      this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'phone number is required' });
      return;
    }

    const phoneRegex = /^(09|\+959)[0-9]{7,10}$/;
    if(!phoneRegex.test(this.customerPhone.trim())){
      this.messageService.add({ 
        key: 'globalMessage', 
        severity: 'error', 
        summary: 'Invalid Phone', 
        detail: 'Please enter a valid Myanmar phone number (e.g., 09xxxxxxxxx)' 
      });
      return;
    }

    this.pendingOrderPayload = {
      phoneNumber: this.customerPhone.trim(),
      note: '',
      items: this.cartItems.map(item => {
        const optionIds: number[] = Object.keys(item.selectedOptions).map(
          key => item.selectedOptions[key].id || item.selectedOptions[key].optionItemId
        ).filter(id => id !== undefined);

        return {
          menuId: item.menuId,
          quantity: item.quantity,
          optionItemSelectedIds: optionIds
        };
      })
    };
    this.displayDialogPhone = false;
    this.displayPaymentDialog = true;
    this.cdr.detectChanges();
    console.log(this.pendingOrderPayload);
  }

  orderAndPayment() {
    if (!this.transitionNote || this.transitionNote.trim() === '') {
      this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Need TransitionId' });
      return;
    }

    this.isloading=true;
    this.cdr.detectChanges();
    this.orderService.create(this.pendingOrderPayload).subscribe({
      next: (res) => {
        this.isloading=false;
        if (res.success && res.data) {
          const createdOrderid = res.data.orderId ?? res.data.OrderId;
          const paymentPayload: ConfirmPaymentRequest = {
            orderId: createdOrderid,
            transitionId: this.transitionNote.trim(),
          };
          this.orderService.confirmPayment(paymentPayload).subscribe({
            next: (res) => {
              this.isloading = false;
              if (res.success) {
                this.messageService.add({ key: 'globalMessage', severity: 'success', summary: 'Success', detail: res.message || 'order success' });
                this.clearCart();
                this.transitionNote = '';
                this.customerPhone = '';
                this.displayPaymentDialog = false;
              } else {
                this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'order fail' });
              }
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.isloading = false;
              this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'order fail' });
              this.cdr.detectChanges();
            }
          });
        }else{
          this.isloading = false; 
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Order creation failed' });
        this.cdr.detectChanges();
        }
      },
      error: (err) => {
      this.isloading = false;
      this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'order fail' });
      this.cdr.detectChanges();
    }
    });
  }

  onSearchChange() {
    const keyword = this.searchQuery.trim().toLowerCase();

    let baseItems = this.menuModel.filter(item => item.isAvailable);
    if (this.selectedCategoryId !== null) {
      baseItems = baseItems.filter(item => item.categoryId === this.selectedCategoryId);
    }

    if (keyword) {
      this.filterMenuItem = baseItems.filter(item => 
        item.menuName.toLowerCase().includes(keyword) || 
        (item.description && item.description.toLowerCase().includes(keyword)) 
      );
    } else {
      this.filterMenuItem = baseItems;
    }
    this.cdr.detectChanges();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}


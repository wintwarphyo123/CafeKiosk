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
import { TimelineModule } from 'primeng/timeline';
import { Router } from '@angular/router';
import { OrderNotificationService } from '../../../cores/services/order-notification-service';
import { BadgeModule } from 'primeng/badge';
import { OptionGroupDto, OptionItemDto } from '../../../cores/models/menu-detail.model';
import { MenuModel } from '../../../cores/models/menu.model';

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
    RadioButtonModule,
    TimelineModule,
    BadgeModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss']
})
export class MenuComponent implements OnInit {

  cartVisible: boolean = false;
  orderSubtotal: number = 1;
  thumbnailUrl: string = '/thumbnail.jpg';
  readonly Object = Object;

  sidebarVisible: boolean = false;
  cartCount: number = 0;
  isloading: boolean = false;
  displayPaymentDialog: boolean = false;
  statusExpanded: boolean = false;
  transitionNote: string = '';
  quantity: number = 1;
  pendingOrderPayload: any = null;
  isAnotherOrderWaiting: boolean = false;
  searchQuery: string = '';

  displayDetail: boolean = false;
  selectedItem: any = null;
  groupedOptions: OptionGroupDto[] = [];
  selectedOptions: { [key: string]: OptionItemDto } = {};
  totalExtraPrice: number = 0;

  categoryModel: CategoryModel[] = [];//category for task bar
  orderModel: OrderRequest[] = [];
  confirmPayment: ConfirmPaymentRequest[] = [];
  selectedCategoryId: number | null = null;
  menuModel: MenuModel[] = [];
  filterMenuItem: any[] = [];
  allOptionGroupList: any[] = [];
  cartItems: any[] = [];
  orderCount: number = 0;
  isAvailable: boolean = true;
  isActive: boolean = true;
  displayVoucherDialog: boolean = false;
  activeTimeoutId: any = null;
  currentOrder: any = {
    orderNumber: 'N/A',
    orderStatus: 'None'
  };

  statusSteps: any[] = [
    { status: 'Paid', label: 'waiting', icon: 'pi pi-clock', color: '#ff9800', stepIndex: 1 },
    { status: 'Preparing', label: 'preparing', icon: 'pi pi-cog', color: '#2196f3', stepIndex: 2 },
    { status: 'Ready', label: 'ready', icon: 'pi pi-check-circle', color: '#4caf50', stepIndex: 3 }
  ];

  paymentStage: 'SELECT' | 'CARD' | 'EPAY' | 'LOADING' = 'SELECT';
  selectedPaymentMethod: 'CARD' | 'EPAY' | null = null;
  cardNumber: string = '';


  constructor(
    private categoryService: CategoryService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private messageService: MessageService,
    private orderService: OrderService,
    private notificationService: OrderNotificationService
  ) { }

  ngOnInit() {
    this.loadCategory();
    this.loadMenu();
    this.listenToOrderUpdates();

    const savedOrderId = localStorage.getItem('currentKioskOrderId');
    if (savedOrderId) {
      this.orderService.getOrderStatusTimeline(Number(savedOrderId)).subscribe({
        next: (orderData: any) => {
          const actualData = orderData?.data ?? orderData;
          const status = actualData?.orderStatus ?? actualData?.OrderStatus ?? actualData?.status;
          if (!actualData || status === 'Ready') {
            this.clearKioskStorage();
          } else {
            this.currentOrder = {
              orderId: Number(savedOrderId),
              orderNumber: localStorage.getItem('currentKioskOrderNumber') || 'N/A',
              orderStatus: status
            };
            if (status === 'Preparing') {
              this.statusExpanded = true;
            }
            else {
              this.statusExpanded = false;

            }
            this.isAnotherOrderWaiting = (status === 'Paid');
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("Order not found or expired from previous day, clearing storage.");
          localStorage.removeItem('currentKioskOrderId');
          localStorage.removeItem('currentKioskOrderNumber');
          localStorage.removeItem('lastOrderStatus');
          this.currentOrder = { orderNumber: 'N/A', orderStatus: 'None' };
          this.statusExpanded = false;
          this.isAnotherOrderWaiting = false;
          this.cdr.detectChanges();
        }
      });
    }

    this.notificationService.listenForMenuUpdate((data) => {
      console.log("Live menu status received: ", data);
      const targetMenu = this.menuModel.find(m => m.menuId === data.menuId);

      if (targetMenu) {
        targetMenu.isAvailable = data.isAvailable;
        this.menuModel = [...this.menuModel]
        this.cdr.detectChanges();
      }
    });

    this.notificationService.listenForCategoryUpdate((data) => {
      console.log("Live category status received: ", data);
      const isCategoryActive = data.IsActive !== undefined ? data.IsActive : data.isActive;
      const targetCategoryId = data.CategoryId !== undefined ? data.CategoryId : data.categoryId;
      if (this.categoryModel && this.categoryModel.length > 0) {
        const targetCategory = this.categoryModel.find(c => c.categoryId === targetCategoryId);
        if (targetCategory) {
          targetCategory.isActive = isCategoryActive;

          this.categoryModel = [...this.categoryModel];
        }
      }
      if (isCategoryActive === true) {
        this.loadMenu();
      } else {
        if (this.menuModel && this.menuModel.length > 0) {
          this.menuModel.forEach(menu => {
            if (menu.categoryId === targetCategoryId) {
              menu.isAvailable = false;
            }
          })
        }
      }
      this.menuModel = [...this.menuModel];
      this.cdr.detectChanges();
    });

  }
  clearKioskStorage() {
    localStorage.removeItem('currentKioskOrderId');
    localStorage.removeItem('currentKioskOrderNumber');
    localStorage.removeItem('lastOrderStatus');
    this.currentOrder = { orderNumber: 'N/A', orderStatus: 'None' };
    this.statusExpanded = false;
    this.isAnotherOrderWaiting = false;
    this.cdr.detectChanges();
  }

  listenToOrderUpdates(): void {
    this.notificationService.listenForOrderReady((data: any) => {
      console.log("SignalR Status Live Update Caught:", data);
      const incomingOrderId = data.orderId ?? data.OrderId ?? data.id;
      const incomingOrderStatus = data.orderStatus ?? data.OrderStatus ?? data.order_status;
      const incomingOrderNumber = data.orderNumber ?? data.OrderNumber ?? data.orderNo ?? ('ORD-' + incomingOrderId);
      const savedOrderId = localStorage.getItem('currentKioskOrderId');

      // ── READY ───────────────────────────────────────────────────────────────
      // Only react to Ready if this kiosk is tracking that specific order
      if (incomingOrderStatus === 'Ready') {
        if (savedOrderId && Number(incomingOrderId) === Number(savedOrderId)) {
          this.currentOrder = {
            orderId: incomingOrderId,
            orderNumber: incomingOrderNumber,
            orderStatus: 'Ready'
          };
          localStorage.setItem('lastOrderStatus', 'Ready');
          this.isAnotherOrderWaiting = false;
          this.statusExpanded = true;   // Keep timeline visible so customer sees "collect"
          this.cdr.detectChanges();

          if (this.activeTimeoutId) {
            clearTimeout(this.activeTimeoutId);
          }

          // After 3 minutes: clear the timeline so the kiosk is ready for a new customer
          this.activeTimeoutId = setTimeout(() => {
            const stillSaved = localStorage.getItem('currentKioskOrderId');
            if (stillSaved && Number(incomingOrderId) === Number(stillSaved)) {
              this.clearKioskStorage();
            }
          }, 180000); // 3 minutes
        }
        return;
      }

      // ── PREPARING ───────────────────────────────────────────────────────────
      // Only update this kiosk's timeline if the Preparing order IS our tracked order.
      if (incomingOrderStatus === 'Preparing') {
        if (!savedOrderId || Number(incomingOrderId) !== Number(savedOrderId)) {
          // This Preparing event belongs to a different order — ignore for this kiosk
          console.log('Preparing event ignored — not our order. Ours:', savedOrderId, 'Event:', incomingOrderId);
          return;
        }

        this.isAnotherOrderWaiting = data.hasOrdersInQueue === true;

        this.currentOrder = {
          orderId: incomingOrderId,
          orderNumber: incomingOrderNumber,
          orderStatus: 'Preparing'
        };

        localStorage.setItem('lastOrderStatus', 'Preparing');
        this.statusExpanded = true;
        this.cdr.detectChanges();
      }
    });

    this.notificationService.listenForQueueStatus((data: any) => {
      console.log("Queue Update Received:", data);
      const currentTimelineStatus = this.currentOrder?.orderStatus ?? 'None';

      if (currentTimelineStatus === 'Preparing' && data.hasOrdersInQueue === true) {
        this.isAnotherOrderWaiting = true;
        this.cdr.detectChanges();
      }
    });
  }

  isStepCompleted(stepStatus: string): boolean {
    const currentStatus = this.currentOrder.orderStatus;

    const statusWeights: { [key: string]: number } = {
      'None': 0,
      'Paid': 1,
      'Preparing': 2,
      'Ready': 3
    };

    const currentWeight = statusWeights[currentStatus] || 1;
    const targetWeight = statusWeights[stepStatus] || 0;

    return currentWeight >= targetWeight;
  }

  loadCategory(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success) {
          const rawCategory = Array.isArray(res.data) ? res.data : [];

          this.categoryModel = rawCategory
            //.filter((c: any) => c.active === 1 || c.isActive === 'true' || c.isActive === true)
            .map((item: any) => ({
              categoryId: item.id ?? item.categoryId ?? item.categoryid ?? 0,
              categoryName: item.categoryName ?? null,
              isActive: item.isActive ?? item.is_active ?? item.Is_active ?? true,
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
  handleImageError(event: any) {
    event.target.src = this.thumbnailUrl;
  }

  getMenuDetailOption(): void {
    this.isloading = true;
    this.menuService.getAllOptionGroups().subscribe({
      next: (res) => {
        this.isloading = false;
        if (res.success) {
          this.allOptionGroupList = res.data ? res.data : (Array.isArray(res) ? res : []);
          this.loadMenu();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load category.' });
        this.loadMenu();
        this.cdr.detectChanges();
      }
    })
  }

  loadMenu(): void {
    this.isloading = true;
    this.menuService.getMenu().subscribe({
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
          menuImage: item.menuImage ? this.getImageUrl(item.menuImage) : null,
          description: item.description ?? '',
          price: item.price ?? 0,
          isAvailable: item.isAvailable ?? item.is_available ?? item.Is_available ?? false,
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
        item => item.categoryId === this.selectedCategoryId //&& item.isAvailable
      );
    } else {
      this.filterMenuItem = this.menuModel;//filter(item => item.isAvailable);
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
          //groupId,groupName,optionItems
          this.groupedOptions = this.allOptionGroupList
            .filter(group => group && linkedGroupIds.includes(Number(group.groupId || group.id)))
            .map(group => {
              const matchingApiGroup = linkedGroup.find((g: any) => Number(g.groupId || g.id) === Number(group.groupId || group.id));
              const apiItems = matchingApiGroup ? (matchingApiGroup.optionItems || matchingApiGroup.items || []) : [];
              return {
                groupId: group.groupId || group.id,
                groupName: group.groupName || group.name,
                optionItems: (group.items || group.options || group.optionItems || []).map((oi: any) => {
                  const currentItemId = oi.id ?? oi.itemId ?? oi.optionItemId;
                  const matchingApiItem = apiItems.find((ai: any) => Number(ai.itemId ?? ai.id) === Number(currentItemId));
                  return {
                    id: currentItemId,
                    itemName: oi.itemName ?? oi.name,
                    extraPrice: oi.extraPrice ?? 0,
                    optionGroupId: group.groupId || group.id,
                    groupName: group.groupName || group.name,
                    isAvailable: matchingApiItem ? matchingApiItem.isAvailable !== false : true
                  }
                })
              }
            });

          this.calculateTotalPrice();
          this.displayDetail = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load options.' });
        this.cdr.detectChanges();
      }
    });
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

  openVoucherDialog(): void {
    if (this.cartItems.length === 0) return;
    this.pendingOrderPayload = {
      note: '',
      items: this.cartItems.map(item => {
        const optionIds: number[] = Object.keys(item.selectedOptions)
          .map(key => {
            const opt = item.selectedOptions[key];
            return opt ? (opt.id ?? opt.itemId ?? opt.optionItemId) : null;
          })
          .filter((id): id is number => id !== null && id !== undefined);

        return { menuId: item.menuId, quantity: item.quantity, optionItemSelectedIds: optionIds };
      })
    };
    this.displayVoucherDialog = true;
    this.cdr.detectChanges();
  }
  gotoPayment() {
    this.pendingOrderPayload = {
      note: '',
      items: this.cartItems.map(item => {

        const optionIds: number[] = Object.keys(item.selectedOptions)
          .map(key => {
            const opt = item.selectedOptions[key];
            return opt ? (opt.id ?? opt.itemId ?? opt.optionItemId) : null;
          })
          .filter((id): id is number => id !== null && id !== undefined);

        return {
          menuId: item.menuId,
          quantity: item.quantity,
          optionItemSelectedIds: optionIds
        };
      })
    };
    this.displayVoucherDialog = false;
    this.displayPaymentDialog = true;
    this.cdr.detectChanges();
    console.log('Final Prepared Payload:', this.pendingOrderPayload);
  }
  handlePaymentSelection(method: 'CARD' | 'EPAY') {
    this.selectedPaymentMethod = method;
    this.paymentStage = method;
  }

  orderAndPayment() {
    if (!this.selectedPaymentMethod) {
      this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Please select a payment method.' });
      return;
    }
    if (this.selectedPaymentMethod === 'CARD' && (!this.cardNumber || this.cardNumber.trim().length < 16)) {
      this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: 'Please enter a valid 16-digit card number.' });
      return;
    }
    this.paymentStage = 'LOADING';
    this.isloading = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.orderService.create(this.pendingOrderPayload).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const createdOrderid = res.data.orderId ?? res.data.OrderId ?? res.data.id;
            const createdOrderNumber = res.data.orderNumber ?? res.data.OrderNumber;

            const paymentNote = this.selectedPaymentMethod === 'CARD'
              ? `Paid via Card (Ends: ${this.cardNumber.substring(this.cardNumber.length - 4)})`
              : 'Paid via E-Wallet Scan';
            const paymentPayload: ConfirmPaymentRequest = {
              orderId: createdOrderid,
              transitionId: paymentNote,
            }

            this.orderService.confirmPayment(paymentPayload).subscribe({
              next: (payRes) => {
                this.isloading = false;
                if (payRes.success && payRes.data) {
                  const targetOrder = payRes.data.order;
                  const serverCalculatedStatus = targetOrder.orderStatus ?? targetOrder.OrderStatus ?? 'Paid';
                  const hasOtherOrdersInQueue = payRes.data.hasOrdersInQueue;

                  // Always save this order so this kiosk tracks it
                  localStorage.setItem('currentKioskOrderId', createdOrderid.toString());
                  localStorage.setItem('currentKioskOrderNumber', createdOrderNumber);
                  localStorage.setItem('lastOrderStatus', serverCalculatedStatus);

                  // Always show customer their order in the timeline, even if queued
                  this.currentOrder = {
                    orderId: createdOrderid,
                    orderNumber: createdOrderNumber,
                    orderStatus: serverCalculatedStatus  // Will be 'Paid' when in queue
                  };

                  // If other orders are being prepared, show queue warning
                  this.isAnotherOrderWaiting = hasOtherOrdersInQueue === true;

                  // Auto-open timeline so customer immediately sees their order number & status
                  this.statusExpanded = true;

                  this.clearCart();
                  this.displayPaymentDialog = false;
                  this.paymentStage = 'SELECT';
                  this.selectedPaymentMethod = null;
                  this.cardNumber = '';

                  this.messageService.add({
                    key: 'globalMessage',
                    severity: 'success',
                    summary: 'Order Placed',
                    detail: `Order #${createdOrderNumber} successfully processed.`,
                    life: 4000
                  });
                  this.cdr.detectChanges();
                } else {
                  this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: payRes.message || 'order fail' });
                }
              },
              error: (err) => {
                this.isloading = false;
                this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'order fail' });
                this.cdr.detectChanges();
              }
            });
          } else {
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
        item.menuName?.toLowerCase().includes(keyword) ||
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


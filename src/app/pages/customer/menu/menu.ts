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
import { MenuModel, RecommendMenu } from '../../../cores/models/menu.model';
import { TrendingItemResponseModel } from '../../../cores/models/dashboard.model';

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
  trendingItem: TrendingItemResponseModel[] = [];//for show ternding menus
  recommendMenu: RecommendMenu[] = [];//for recommend menu

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
  specialMenuItems: MenuModel[] = [];
  //  featuredSpecialItem: MenuModel | null = null;

  statusSteps: any[] = [
    { status: 'Pending', label: 'Order Placed', icon: 'pi pi-clock', color: '#6B7280' },
    { status: 'Paid', label: 'waiting', icon: 'pi pi-clock', color: '#ff9800', stepIndex: 1 },
    { status: 'Preparing', label: 'preparing', icon: 'pi pi-cog', color: '#2196f3', stepIndex: 2 },
    { status: 'Ready', label: 'ready', icon: 'pi pi-check-circle', color: '#4caf50', stepIndex: 3 }
  ];

  displayReceiptModal: boolean = false;
  displayRecommendMenu: boolean = false;


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
    this.SpecialMenu();
    this.loadCategory();
    this.loadMenu();
    this.listenToOrderUpdates();


    // const savedOrderId = localStorage.getItem('currentKioskOrderId');
    // if (savedOrderId) {
    //   this.orderService.getOrderStatusTimeline(Number(savedOrderId)).subscribe({
    //     next: (orderData: any) => {
    //       const actualData = orderData?.data ?? orderData;
    //       const status = actualData?.orderStatus ?? actualData?.OrderStatus ?? actualData?.status;
    //       if (!actualData || status === 'Ready') {
    //         this.clearKioskStorage();
    //       } else {
    //         this.currentOrder = {
    //           orderId: Number(savedOrderId),
    //           orderNumber: localStorage.getItem('currentKioskOrderNumber') || 'N/A',
    //           orderStatus: status
    //         };
    //         if (status === 'Preparing') {
    //           this.statusExpanded = true;
    //         }
    //         else {
    //           this.statusExpanded = false;

    //         }
    //         this.isAnotherOrderWaiting = (status === 'Paid');
    //       }
    //       this.cdr.detectChanges();
    //     },
    //     error: (err) => {
    //       console.warn("Order not found or expired from previous day, clearing storage.");
    //       localStorage.removeItem('currentKioskOrderId');
    //       localStorage.removeItem('currentKioskOrderNumber');
    //       localStorage.removeItem('lastOrderStatus');
    //       this.currentOrder = { orderNumber: 'N/A', orderStatus: 'None' };
    //       this.statusExpanded = false;
    //       this.isAnotherOrderWaiting = false;
    //       this.cdr.detectChanges();
    //     }
    //   });
    // }

    const savedOrderId = localStorage.getItem('currentKioskOrderId');

    if (savedOrderId) {
      this.orderService.getOrderStatusTimeline(Number(savedOrderId)).subscribe({
        next: (orderData: any) => {
          const actualData = orderData?.data ?? orderData;
          const status = actualData?.orderStatus ?? actualData?.OrderStatus ?? actualData?.status;

          // 1. Order မရှိတော့လျှင် သို့မဟုတ် Completed ဖြစ်သွားမှ Storage ရှင်းမည်
          if (!actualData || status === 'Completed' || status === 'Cancelled') {
            this.clearKioskStorage();
          } else {
            // 2. Active Order Data ကို Mapping လုပ်မည် (Pending, Paid, Preparing, Ready အားလုံးပါဝင်မည်)
            this.currentOrder = {
              orderId: Number(savedOrderId),
              orderNumber: localStorage.getItem('currentKioskOrderNumber') || 'N/A',
              orderStatus: status,
              orderItems: actualData?.orderItems || []
            };

            // 3. Status ပေါ်မူတည်၍ Drawer ပွင့်ရန်/ပိတ်ရန် သတ်မှတ်ခြင်း
            // Pending, Paid, Preparing, Ready အားလုံးတွင် Tracking Drawer ကို ဖွင့်ပေးထားမည်
            if (['Pending', 'Paid', 'Preparing', 'Ready'].includes(status)) {
              this.statusExpanded = true;
            } else {
              this.statusExpanded = false;
            }

            // 4. Queue Alert Logic ကို ပြင်ဆင်ခြင်း (Backend Response ထဲမှ Flag ကို ယူသုံးခြင်း သို့မဟုတ် API Field အတိုင်း စစ်ခြင်း)
            this.isAnotherOrderWaiting = actualData?.hasOrdersAhead ?? false;
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("Order not found or expired, clearing storage.", err);
          this.clearKioskStorage();
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

    this.notificationService.listenForMenuSpecialUpdate((data) => {
      console.log("Live menu status received: ", data);
      const targetMenu = this.menuModel.find(m => m.menuId === data.menuId);

      if (targetMenu) {
        targetMenu.isAvailable = data.isAvailable;
        this.menuModel = [...this.menuModel]
        this.cdr.detectChanges();
      }
    });

    this.notificationService.listenForMenuArchivedUpdate((data) => {
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
          });
          this.menuModel = [...this.menuModel];
        }
      }//if category is disable, the related menu also out of stock
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
  SpecialMenu(): void {
    this.menuService.getSpecialData().subscribe({
      next: (res) => {
        if (res.success) {
          const rawMenu = Array.isArray(res.data) ? res.data : [];
          this.specialMenuItems = rawMenu.map((item) => ({
            menuId: item.Id ?? item.menuId ?? item.id ?? 0,
            menuName: item.menuName ?? '',
            menuImage: item.menuImage ? this.getImageUrl(item.menuImage) : null,
            description: item.description ?? '',
            price: item.price ?? 0,
            isAvailable: item.isAvailable ?? item.is_available ?? item.Is_available ?? false,
            categoryId: item.categoryId ?? 0,
            categoryName: item.categoryName ?? '',
            isSpecial: item.isSpecial ?? false,
            archived: item.archived ?? false,
          }));
        }
        else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Failed to load special menus.' });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Failed to load Special menus.' });

      }
    });
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
          categoryName: item.categoryName ?? '',
          isSpecial: item.isSpecial ?? false,
          archived: item.archived ?? false,
        }));
        // this.featuredSpecialItem = this.specialMenuItems.length >0 ? this.specialMenuItems[0] : null;
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
              };
            });
          this.groupedOptions.forEach((group: any) => {
            if (group.optionItems && group.optionItems.length > 0) {
              const groupIdKey = group.groupId.toString();

              // 1. Try to find a default keyword (Normal, Regular, Medium, Standard)
              const defaultOption = group.optionItems.find((opt: any) =>
                opt.isAvailable &&
                /normal|regular|medium|standard/i.test(opt.itemName)
              )
                // 2. Fallback to the first available option item
                || group.optionItems.find((opt: any) => opt.isAvailable);

              if (defaultOption) {
                this.selectedOptions[groupIdKey] = defaultOption;
              }
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
    //mainMenuId, recommendedMenuId, recommendedMenuName, recommendedMenuPrice, recommendedMenuImageUrl, pairingCount, supportScore 

    this.menuService.getRecommendedMenu(item.menuId).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        if (Array.isArray(data) && data.length > 0) {
          this.recommendMenu = data.map((rec: any) => ({
            mainMenuId: rec.mainMenuId ?? rec.menuId ?? item.menuId,
            recommendedMenuId: rec.recommendedMenuId ?? rec.id ?? rec.menuId,
            recommendedMenuName: rec.recommendedMenuName ?? rec.menuName ?? rec.name ?? '',
            recommendedMenuPrice: rec.recommendedMenuPrice ?? rec.price ?? 0,
            // Image path ကို getImageUrl() ဖြင့် ဖြတ်ပေးခြင်း
            recommendedMenuImageUrl: rec.recommendedMenuImageUrl || rec.menuImage || rec.image
              ? this.getImageUrl(rec.recommendedMenuImageUrl || rec.menuImage || rec.image)
              : null,
              pairingCount: rec.pairingCount ?? 0,
              supportScore: rec.supportScore ?? 0
          }));
        } else {
          this.recommendMenu = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.recommendMenu = [];
        console.log('No recommendations found for this item.', err);
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
    if (this.recommendMenu && this.recommendMenu.length > 0) {
      this.recommendationMenuDialog();
    }
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

  recommendationMenuDialog(): void {
    this.displayRecommendMenu = true;
    this.cdr.detectChanges();
  }

  addRecommendedToCart(item: RecommendMenu): void {
    const existingItem = this.cartItems.findIndex(cart => cart.menuId === item.recommendedMenuId);

    if (existingItem > -1) {
      this.cartItems[existingItem].quantity += 1;
      this.cartItems[existingItem].calculatedPrice = this.cartItems[existingItem].quantity * this.cartItems[existingItem].singleTotalPrice;
    } else {
      this.cartItems.push({
        menuId: item.recommendedMenuId,
        menuName: item.recommendedMenuName,
        basePrice: item.recommendedMenuPrice,
        selectedOptions: {},
        quantity: 1,
        singleTotalPrice: item.recommendedMenuPrice,
        calculatedPrice: item.recommendedMenuPrice
      });
    }

    this.calculateCartTotalPrice();
    this.messageService.add({
      key: 'globalMessage',
      severity: 'success',
      summary: 'Added Recommended Item',
      detail: `${item.recommendedMenuName} added to cart!`
    });
  }

  placeOrderCashAtCounter() {
    this.isloading = true;
    this.cdr.detectChanges();

    // Prepare payload directly
    this.pendingOrderPayload = {
      note: 'Cash at Counter',
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

    this.orderService.create(this.pendingOrderPayload).subscribe({
      next: (res) => {
        this.isloading = false;
        if (res.success && res.data) {
          const createdOrder = res.data;

          // Store order details locally for printing/displaying
          this.currentOrder = createdOrder;
          localStorage.setItem('currentKioskOrderId', createdOrder.orderId.toString());
          localStorage.setItem('currentKioskOrderNumber', createdOrder.orderNumber);

          // Show receipt dialog or invoke browser print window
          this.displayReceiptModal = true;
          this.clearCart();

          this.messageService.add({
            key: 'globalMessage',
            severity: 'info',
            summary: 'Order Placed',
            detail: `Please take your receipt #${createdOrder.orderNumber} to the cashier.`,
            life: 5000
          });

          // Optional: Trigger native printer directly
          //setTimeout(() => this.printReceipt(), 300);
          setTimeout(() => {
            this.closeModal();
          }, 5000);

          this.cdr.detectChanges();
        } else {
          this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: res.message || 'Order creation failed' });
        }
      },
      error: (err) => {
        this.isloading = false;
        this.messageService.add({ key: 'globalMessage', severity: 'error', summary: 'Error', detail: err.message || 'Order creation failed' });
        this.cdr.detectChanges();
      }
    });
  }

  printReceipt() {
    window.print();
  }
  closeModal(): void {
    this.displayReceiptModal = false;
    this.displayVoucherDialog = false;
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


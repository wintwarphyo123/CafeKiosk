import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard'; 
import { Category } from './pages/category/category';
import { Menu } from './pages/menu/menu';
import { User } from './pages/user/user';
import { OptionGroup } from './pages/option-group/option-group';
import { OptionItem } from './pages/option-item/option-item';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { StaffLayout } from './layouts/staff-layout/staff-layout';
import { MenuDetail } from './pages/menu-detail/menu-detail';
import { Login } from './pages/login/login';
import { MenuComponent } from './pages/customer/menu/menu';
import { Orders } from './pages/orders/orders';
import { OrderDetail } from './pages/orders/order-detail/order-detail';
import { KitchenDashboard } from './pages/kitchen-dashboard/kitchen-dashboard';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  // Default Application Entry Point
  {
    path: '',
    redirectTo: 'customer_menu',
    pathMatch: 'full'
  },
  {
    path: 'customer_menu',
    component: MenuComponent
  },
  {
    path: 'login',
    component: Login
  },

  // Admin Management Console Layout
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'category',
        component: Category
      },
      {
        path: 'menu',
        component: Menu
      },
      {
        path: 'menu/detail/:id',
        component: MenuDetail
      },
      {
        path: 'option-group',
        component: OptionGroup
      },
      {
        path: 'option-items',
        component: OptionItem
      },
      {
        path: 'users',
        component: User
      },
      {
        path: 'orders',
        component: Orders
      },
      {
        path: 'order/detail/:id',
        component: OrderDetail
      },
      {
        path:'reports',
        component: Reports
      }
    ]
  },

 
  {
    path: 'staff',
    component: StaffLayout,
    children: [
      {
        path: '',
        redirectTo: 'kitchen-dashboard',
        pathMatch: 'full'
      },
      {
        path: 'kitchen-dashboard',
        component: KitchenDashboard
      },
      {
      path: 'menu',
      component: Menu 
    }
    ]
  },

 
  {
    path: '**',
    redirectTo: 'customer_menu' 
  }
];
import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard'; // Dashboard ရှိလျှင် Import လုပ်ပါ (မရှိသေးက ဆောက်ပေးရန်လိုပါသည်)
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

export const routes: Routes = [

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
      }
    ]
  },
  {
    path: 'login',
    component: Login
  },

  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'admin/dashboard'
  },
  {
    path: 'staff',
    component: StaffLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
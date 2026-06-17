import { Routes } from '@angular/router';
import { Category } from './pages/category/category';
import {Menu} from './pages/menu/menu';
import { User } from './pages/user/user';

export const routes: Routes = [
    {
        path:'category',
        component:Category
    },
    {
        path:'menu',
        component:Menu
    },
    {
        path:'user',
        component:User
    }
];

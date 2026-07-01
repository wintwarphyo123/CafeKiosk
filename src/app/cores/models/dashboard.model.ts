export interface DashboardModel {
    totalMenu:number;
    totalCategory:number;
    totalOrders:number;
    totalRevenue:number;
    totalStaff:number;
}

export interface TrendingItemResponseModel{
    menuId:number;
    menuName:string;
    categoryName:string;
    totalSales:number;
    percentage:number
}

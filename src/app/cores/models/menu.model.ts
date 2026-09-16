export interface MenuModel {
    menuId: number;
    menuName: string | null;
    menuImage: string | null;
    description: string | null;
    price: number | null;
    isAvailable: boolean | null;
    categoryId: number | null;
    categoryName:string|null;
    isSpecial:boolean| null;
    archived:boolean|null;
}//menuId,menuName,menuImage,description,price,isAvailable,categoryId,categoryName
//mainMenuId, recommendedMenuId, recommendedMenuName, recommendedMenuPrice, recommendedMenuImageUrl, pairingCount, supportScore 
export interface RecommendMenu{
    mainMenuId:number |null;
    recommendedMenuId:number|null;
    recommendedMenuName:string|null;
    recommendedMenuPrice:number |null;
    recommendedMenuImageUrl:string |null;
    pairingCount:number |null;
    supportScore:number |null;
}



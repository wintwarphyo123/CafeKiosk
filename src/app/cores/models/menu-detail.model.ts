// menu-detail.model.ts

export interface OptionItemDto {
    itemId: number;
    itemName: string;
    extraPrice: number;
}

export interface OptionGroupDto {
    groupId: number;
    groupName: string;
    optionItems: OptionItemDto[];
}

export interface MenuDetailResponseDto {
    menuId: number;
    menuName: string | null;
    price: number | null;
    description: string | null;
    optionGroups: OptionGroupDto[];
}

export interface RequestMenuOptionGroupDto {
    menuId: number;
    optionGroupIds: number[];
}

export interface AllCategoryForDropDown{
    CategoriesId:number;
    CategoriesName:string;
}

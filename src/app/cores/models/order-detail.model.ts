export interface OrderItemRequest {
    menuId:number;
    quantity:number;
    optionItemSelectedIds:number[];
}

export interface OrderRequest{
    phoneNumber:string;
    items:OrderItemRequest[];
}

export interface ConfirmPaymentRequest{
    orderId:number;
    transitionId:string
}
//orderId,orderNumber,totalAmount,orderStatus,note,createdAt,orderItems
export interface OrderResponseDto{
    orderId:number;
    orderNumber:string;
    totalAmount:number;
    orderStatus:string;
    phoneNumber:string;
    note:string;
    createdAt:string;
    updatedAt:string;
    orderItems:OrderItemResponseDto[]
}

export interface OrderItemResponseDto{
    orderItemId:number;
    menuId:number;
    menuName:string;
    quantity:number;
    priceAtOrder:number;
    selectedOptions:SelectedOptionDto[]
}
export interface SelectedOptionDto{
    optionGroupName:string;
    optionItemName:string;
    extraPrice:number;
}
export interface OrderModel {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    note: string | null;
    createdAt: string;
    updatedAt:string;
}//orderId,orderNumber,totalAmount,orderStatus,phoneNumber,note,createdAt
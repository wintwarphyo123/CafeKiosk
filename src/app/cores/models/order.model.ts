export interface OrderModel {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    phoneNumber: string | null;
    note: string | null;
    createdAt: string;
}//orderId,orderNumber,totalAmount,orderStatus,phoneNumber,note,createdAt
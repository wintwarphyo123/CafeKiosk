export interface RootModel {
    success: boolean;
    code: number;
    message: string;
    data: any;
}

export interface SortColumn{
    field:string;
    header:string;
}

export interface UserModel {
    userId: string;
    userName: string | null;
    status: boolean | null;
    email:string| null;
    phoneNumber:string|null;
    joinDate: string | null;
    password:string|null;
    role: string | null;
    profileImage: string | null;
}//userId,userName,status,email,role,joinDate,phoneNumber,profileImage

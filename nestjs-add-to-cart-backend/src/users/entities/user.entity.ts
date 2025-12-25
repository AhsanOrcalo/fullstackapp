import { Role } from '../enums/role.enum';

export class User {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string; // hashed password
  role: Role;
  createdAt: Date;
}


export enum UserRole {
  ADMIN = 'admin',
  TASK_SLAVE = 'task_slave',
  MEMBER = 'member',
  NORMAL = 'normal',
  ANONYMOUS = 'anonymous'
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    userName: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    authorityKeys: string[];
  }
}

export interface UserExtraInfo {
  profileImage?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: Date;
  country?: string;
  city?: string;
  location?: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  authorityKeys: string[];
  credit: number;
  extraInfo?: UserExtraInfo;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone?: string;
}

export interface Task {
  id: number;
  name: string;
  status: 'init' | 'queueing' | 'pending' | 'running' | 'success' | 'failed';
  data: string;
  resultData?: string;
  progressData?: string;
  createTime: string;
  updateTime: string;
  templateId: number;
}

export interface CreateTaskParams {
  name: string;
  data: string;
  templateId?: number;
  templateName: string;
}

export interface TaskTemplateMeta {
  id: number;
  image: string;
  description: string;
}

export interface TaskTemplate {
  id: number;
  name: string;
  dataSchema: string;
  resultSchema: string;
  visible: boolean;
  createTime: Date;
  updateTime: Date;
  meta: TaskTemplateMeta;
}

export interface CreateTemplateData {
  name: string;
  dataSchema: string;
  resultSchema: string;
  visible: boolean;
  meta: {
    image: string;
    description: string;
  };
}

export enum TransactionType {
    CONSUMPTION = 'consumption',
    RECHARGE = 'recharge',
    SYSTEM_REWARD = 'reward'
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface Transaction {
    id: number;
    userId: number;
    amount: number;
    transactionDate: Date;
    transactionType: TransactionType;
    status: TransactionStatus;
    description?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  originalPrice?: number | null;
  discountTag?: string | null;
  badge?: string | null;
  unit: string; // e.g. "/ikat", "/pak"
  image: string;
  imagesJson?: string | null;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  storeId?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  isFreshDaily?: boolean;
  isOrganicCertified?: boolean;
  isActive?: boolean;
  stock?: number;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  count?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  label: string; // e.g. "Rumah", "Kantor"
  fullName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  village?: string;
  postalCode: string;
  streetAddress: string; // Nama Jalan, Gedung, No. Rumah
  landmark?: string; // Detail lainnya (patokan)
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export type OrderStatus =
  | 'new'
  | 'processing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export interface AdminProduct extends Product {
  isActive: boolean;
  stock: number;
  longDescription?: string;
}

export interface AdminOrderItem {
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface AdminOrder {
  id: string;
  dbId?: string;
  customerName: string;
  phone: string;
  orderTime: string;
  orderDate: string;
  itemsSummary: string; // e.g. "Bayam (2), Tomat (1)..."
  items: AdminOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  discountTag: string;
  image: string;
  isActive: boolean;
  storeId?: string;
  targetStoreId?: string;
}

export interface StoreProfile {
  id?: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  image?: string;
  openingHours?: string;
}

export interface ShippingOptionAdmin {
  id: string;
  code?: string;
  name: string;
  courier: string;
  fee: number;
  baseFee?: number;
  feePerKm?: number;
  estimated: string;
  estimatedTime?: string;
  isActive: boolean;
  storeId?: string;
}

export interface PaymentOptionAdmin {
  id: string;
  name: string;
  category: string;
  iconType: 'qris' | 'bca' | 'mandiri' | 'cod' | 'cc';
  isActive: boolean;
}

export type UserRole = 'superadmin' | 'admin_store' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  assignedStoreId?: string;
  assignedStoreName?: string;
  joinedDate: string;
  totalOrdersOrSales: number;
  avatarUrl?: string;
  activeBalance?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

export interface BalanceMutation {
  id: string;
  userId?: string | null;
  storeId?: string | null;
  orderId?: string | null;
  type: 'CREDIT' | 'DEBIT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  withdrawalNo: string;
  userId?: string | null;
  storeId?: string | null;
  amount: number;
  disbursementFee: number;
  netAmount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  disbursementRef?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletInfo {
  activeBalance: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  mutations: BalanceMutation[];
}


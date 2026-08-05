export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  originalPrice?: number | null;
  discountTag?: string | null;
  badge?: string | null;
  unit: string; // e.g. "/ikat", "/pak"
  weightInGrams?: number; // e.g. 500
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
  itemsSummary: string;
  items: AdminOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  // Shipping system fields
  shippingType?: ShippingType;
  shippingFee?: number;
  pickupCode?: string;
  pickupQrData?: string;
  pickupLocationId?: string;
  pickupStatus?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  biteshipOrderId?: string;
  biteshipTrackingUrl?: string;
  biteshipWaybillId?: string;
  codVerified?: boolean;
  codCashCollected?: boolean;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
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

export type ShippingType = 'instant' | 'pickup' | 'scheduled' | 'cod';

export interface PickupLocation {
  id: string;
  storeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  pickupFee?: number;
  isActive: boolean;
}

export interface ScheduleSlot {
  id: string;
  shippingOptionId: string;
  label: string;
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
  currentOrders?: number;
  available?: boolean;
}

export interface ShippingOptionAdmin {
  id: string;
  code?: string;
  name: string;
  type: ShippingType;
  courier: string;
  fee: number;
  baseFee?: number;
  feePerKm?: number;
  pickupFee?: number;
  maxRadiusKm?: number;
  codEnabled?: boolean;
  scheduleMode?: string;
  estimated: string;
  estimatedTime?: string;
  isActive: boolean;
  storeId?: string;
  scheduleSlots?: ScheduleSlot[];
}

export interface CourierCashRecord {
  id: string;
  orderId: string;
  storeId: string;
  courierName: string;
  courierPhone: string;
  cashAmount: number;
  status: 'HOLDING' | 'DEPOSITED';
  depositedAt?: string;
  createdAt: string;
  order?: { orderNo: string; totalPrice: number; customerName: string };
}

export interface BiteshipRate {
  courierName: string;
  courierCode: string;
  serviceName: string;
  serviceCode: string;
  description: string;
  price: number;
  duration: string;
  durationUnit: string;
  type: string;
  availableCashOnDelivery?: boolean;
  maxWeightKg?: number;
}

export interface BiteshipCourierConfig {
  id: string;
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  description: string;
  shipmentDuration: string;
  availableCashOnDelivery: boolean;
  isActive: boolean;
  maxWeightKg: number;
  createdAt?: string;
  updatedAt?: string;
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


export type AudienceType = 'adults' | 'kids';

export type CategoryType =
  | 'tanks'
  | 'tees'
  | 'hoodies'
  | 'sweatshirts'
  | 'jackets'
  | 'cargos'
  | 'shorts'
  | 'tracksuits'
  | 'shoes';

export interface ProductColorVariant {
  name: string;
  hex: string;
  isDefault?: boolean;
  frontImage?: string;
  backImage?: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  audience: AudienceType;
  category: CategoryType;
  priceUsd: number;
  pricePkr: number;
  description: string;
  frontImage: string;
  backImage: string | null;
  sizes: string[];
  colors?: ProductColorVariant[];
  stockCount: number;
  featured: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  productId: number;
  name: string;
  audience: AudienceType;
  category: CategoryType;
  size: string;
  color?: string;
  colorHex?: string;
  qty: number;
  priceUsd: number;
  pricePkr: number;
  image: string;
}

export interface StoreSettings {
  brandName: string;
  topAnnouncement: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  tickerText: string;
}

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'customer';
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalUsd: number;
  totalPkr: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  channel: string;
  createdAt: string;
}

export interface AdminStats {
  totalProducts: number;
  adultsCount: number;
  kidsCount: number;
  shoesCount: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenueUsd: number;
  totalRevenuePkr: number;
}

export interface AdminOverview {
  products: Product[];
  orders: OrderRecord[];
  settings: StoreSettings;
  stats: AdminStats;
}

import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface ProductColorVariant {
  name: string;
  hex: string;
  isDefault?: boolean;
  frontImage?: string;
  backImage?: string;
}

export interface OrderItemRecord {
  productId: number | string;
  name: string;
  audience: string;
  category: string;
  size: string;
  color?: string;
  qty: number;
  priceUsd: number;
  pricePkr: number;
  image: string;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  audience: text('audience').notNull().default('adults'), // 'adults' | 'kids'
  category: text('category').notNull().default('tees'), // 'tanks' | 'tees' | 'hoodies' | 'sweatshirts' | 'jackets' | 'cargos' | 'shorts' | 'tracksuits' | 'shoes'
  priceUsd: integer('price_usd').notNull(),
  pricePkr: integer('price_pkr').notNull(),
  description: text('description').notNull(),
  frontImage: text('front_image').notNull(),
  backImage: text('back_image'),
  sizes: jsonb('sizes').$type<string[]>().notNull(),
  colors: jsonb('colors').$type<ProductColorVariant[]>().notNull().default([]),
  stockCount: integer('stock_count').notNull().default(7),
  featured: boolean('featured').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address').notNull(),
  items: jsonb('items').$type<OrderItemRecord[]>().notNull(),
  totalUsd: integer('total_usd').notNull(),
  totalPkr: integer('total_pkr').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  channel: text('channel').notNull().default('whatsapp'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storeSettings = pgTable('store_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

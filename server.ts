import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  createOrderRecord,
  createProductRecord,
  deleteProductRecord,
  ensureSeeded,
  getAdminOverviewData,
  getPublicStorefrontData,
  getStoreSetting,
  getUserOrders,
  setStoreSetting,
  updateOrderStatusRecord,
  updateProductRecord,
} from './src/db/catalog.ts';
import { promoteUserToAdmin } from './src/db/users.ts';
import { optionalAuth, requireAdmin, requireAuth, type AuthRequest } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  // Public health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public storefront catalog & settings
  app.get('/api/storefront', async (_req, res) => {
    try {
      const data = await getPublicStorefrontData();
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load storefront.';
      res.status(500).json({ error: message });
    }
  });

  // Public order creation (linked to Firebase user when signed in)
  app.post('/api/orders', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { customerName, customerPhone, customerAddress, items, channel } = req.body ?? {};
      if (
        typeof customerName !== 'string' ||
        !customerName.trim() ||
        typeof customerPhone !== 'string' ||
        !customerPhone.trim() ||
        typeof customerAddress !== 'string' ||
        !customerAddress.trim() ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        res.status(400).json({ error: 'Please complete Name, Phone, Address, and add items to your bag.' });
        return;
      }

      const normalizedItems = items.map((item) => ({
        productId: item.productId ?? item.id ?? 0,
        name: String(item.name || 'OFFHOOK ITEM'),
        audience: String(item.audience || 'adults'),
        category: String(item.category || 'tees'),
        size: String(item.size || 'M'),
        ...(typeof item.color === 'string' && item.color.trim() ? { color: item.color.trim() } : {}),
        qty: Math.max(1, Number(item.qty) || 1),
        priceUsd: Math.max(0, Number(item.priceUsd) || 0),
        pricePkr: Math.max(0, Number(item.pricePkr) || 0),
        image: String(item.image || ''),
      }));

      const totalUsd = normalizedItems.reduce((sum, it) => sum + it.priceUsd * it.qty, 0);
      const totalPkr = normalizedItems.reduce((sum, it) => sum + it.pricePkr * it.qty, 0);

      const created = await createOrderRecord({
        userId: req.dbUser?.id ?? null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: normalizedItems,
        totalUsd,
        totalPkr,
        channel: typeof channel === 'string' ? channel : 'whatsapp',
      });

      res.status(201).json({ order: created });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order.';
      res.status(500).json({ error: message });
    }
  });

  // Authenticated user profile & order history
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  app.get('/api/orders/mine', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userOrders = await getUserOrders(req.dbUser.id);
      res.json({ orders: userOrders });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch orders.';
      res.status(500).json({ error: message });
    }
  });

  // Admin PIN unlock (requires authenticated Firebase session)
  app.post('/api/admin/unlock', requireAuth, async (req: AuthRequest, res) => {
    try {
      await ensureSeeded();
      const { pin } = req.body ?? {};
      const expectedPin = (await getStoreSetting('admin_pin')) || 'admin123';
      if (typeof pin !== 'string' || pin.trim() !== expectedPin) {
        res.status(403).json({ error: 'Wrong Admin PIN. Access denied.' });
        return;
      }
      if (!req.user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const promoted = await promoteUserToAdmin(req.user.uid);
      res.json({ user: promoted });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin verification failed.';
      res.status(500).json({ error: message });
    }
  });

  // Protected Admin Routes
  app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const data = await getAdminOverviewData();
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load admin overview.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
    try {
      const {
        name,
        audience,
        category,
        priceUsd,
        pricePkr,
        description,
        frontImage,
        backImage,
        sizes,
        colors,
        stockCount,
      } = req.body ?? {};

      if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof frontImage !== 'string' ||
        !frontImage.trim()
      ) {
        res.status(400).json({ error: 'Product name and front image are required.' });
        return;
      }

      const defaultSizes =
        category === 'shoes'
          ? ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44']
          : audience === 'kids'
            ? ['4-5Y', '6-7Y', '8-9Y', '10-12Y', '13-14Y']
            : ['S', 'M', 'L', 'XL'];

      const normalizedColors = Array.isArray(colors)
        ? colors
            .filter((c) => c && typeof c.name === 'string' && typeof c.hex === 'string')
            .slice(0, 6)
            .map((c, idx) => ({
              name: String(c.name).trim(),
              hex: String(c.hex).trim(),
              isDefault: Boolean(c.isDefault ?? idx === 0),
              ...(typeof c.frontImage === 'string' && c.frontImage.trim()
                ? { frontImage: c.frontImage.trim() }
                : {}),
              ...(typeof c.backImage === 'string' && c.backImage.trim()
                ? { backImage: c.backImage.trim() }
                : {}),
            }))
        : [];

      const product = await createProductRecord({
        name: name.trim(),
        audience: audience === 'kids' ? 'kids' : 'adults',
        category: typeof category === 'string' ? category : 'tees',
        priceUsd: Math.max(1, Number(priceUsd) || 38),
        pricePkr: Math.max(100, Number(pricePkr) || 3499),
        description:
          typeof description === 'string' && description.trim()
            ? description.trim()
            : 'Limited studio drop.',
        frontImage: frontImage.trim(),
        backImage: typeof backImage === 'string' && backImage.trim() ? backImage.trim() : frontImage.trim(),
        sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes.map(String) : defaultSizes,
        colors: normalizedColors,
        stockCount: Math.max(0, Number(stockCount) ?? 7),
      });

      res.status(201).json({ product });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid product ID.' });
        return;
      }
      const patch: Record<string, unknown> = {};
      const body = req.body ?? {};
      if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim().toUpperCase();
      if (body.audience === 'adults' || body.audience === 'kids') patch.audience = body.audience;
      if (typeof body.category === 'string') patch.category = body.category;
      if (body.priceUsd !== undefined) patch.priceUsd = Math.max(1, Number(body.priceUsd) || 1);
      if (body.pricePkr !== undefined) patch.pricePkr = Math.max(1, Number(body.pricePkr) || 1);
      if (typeof body.description === 'string') patch.description = body.description.trim();
      if (body.stockCount !== undefined) patch.stockCount = Math.max(0, Number(body.stockCount) || 0);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
      if (Array.isArray(body.sizes)) patch.sizes = body.sizes.map(String);
      if (Array.isArray(body.colors)) patch.colors = body.colors.slice(0, 6);

      const updated = await updateProductRecord(id, patch);
      if (!updated) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      res.json({ product: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid product ID.' });
        return;
      }
      const deleted = await deleteProductRecord(id);
      if (!deleted) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      res.json({ deleted });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/orders/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = req.body?.status;
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!Number.isInteger(id) || id <= 0 || !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid order ID or status.' });
        return;
      }
      const updated = await updateOrderStatusRecord(id, status);
      if (!updated) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      res.json({ order: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order status.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/settings', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { brandName, topAnnouncement, whatsappDisplay, tickerText, adminPin } = req.body ?? {};
      if (typeof brandName === 'string' && brandName.trim()) {
        await setStoreSetting('brand_name', brandName.trim());
      }
      if (typeof topAnnouncement === 'string' && topAnnouncement.trim()) {
        await setStoreSetting('top_announcement', topAnnouncement.trim());
      }
      if (typeof whatsappDisplay === 'string' && whatsappDisplay.trim()) {
        const cleanDisplay = whatsappDisplay.trim();
        const digits = cleanDisplay.replace(/\D/g, '');
        const waIntl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
        await setStoreSetting('whatsapp_display', cleanDisplay);
        await setStoreSetting('whatsapp_number', waIntl);
      }
      if (typeof tickerText === 'string' && tickerText.trim()) {
        await setStoreSetting('ticker_text', tickerText.trim());
      }
      if (typeof adminPin === 'string' && adminPin.trim().length >= 4) {
        await setStoreSetting('admin_pin', adminPin.trim());
      }
      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update store settings.';
      res.status(500).json({ error: message });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use('/src/assets', express.static(path.join(distPath, 'src/assets')));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OFFHOOK server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

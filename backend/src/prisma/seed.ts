import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OrganikStore Database Seeding...');

  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Seed Categories
  const categories = [
    { id: 'cat-1', name: 'Sayur Segar', slug: 'sayur-segar', icon: 'Leaf' },
    { id: 'cat-2', name: 'Buah Organik', slug: 'buah-organik', icon: 'Apple' },
    { id: 'cat-3', name: 'Daging & Ayam', slug: 'daging-ayam', icon: 'Drumstick' },
    { id: 'cat-4', name: 'Susu & Telur', slug: 'susu-telur', icon: 'Milk' },
    { id: 'cat-5', name: 'Bumbu & Rempah', slug: 'bumbu-rempah', icon: 'Sparkles' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log('✅ Categories seeded.');

  // 2. Seed Stores
  const stores = [
    {
      id: 'store-1',
      name: 'OrganikStore Cabang Senopati',
      address: 'Jl. Senopati No. 45, Kebayoran Baru',
      city: 'Jakarta Selatan',
      latitude: -6.2312,
      longitude: 106.8091,
      phone: '0812-1111-2222',
      operatingHours: 'Senin - Minggu 08.00 - 21.00 WIB',
      coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      rating: 4.9,
    },
    {
      id: 'store-2',
      name: 'OrganikStore Cabang Kemang',
      address: 'Jl. Kemang Raya No. 12B',
      city: 'Jakarta Selatan',
      latitude: -6.2731,
      longitude: 106.8152,
      phone: '0812-3333-4444',
      operatingHours: 'Senin - Minggu 08.00 - 21.00 WIB',
      coverImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
      rating: 4.8,
    },
    {
      id: 'store-3',
      name: 'OrganikStore Cabang Kelapa Gading',
      address: 'Boulevard Raya Blok QF 1 No. 8',
      city: 'Jakarta Utara',
      latitude: -6.1558,
      longitude: 106.9025,
      phone: '0812-5555-6666',
      operatingHours: 'Senin - Minggu 08.00 - 21.00 WIB',
      coverImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
      rating: 4.9,
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: store,
      create: store,
    });
  }
  console.log('✅ Physical Stores seeded.');

  // 3. Seed Users (Superadmin, Store Admins, Customer)
  const passwordHash = await bcrypt.hash('admin123', 10);

  const users = [
    {
      id: 'usr-superadmin',
      name: 'Hendro Superadmin',
      email: 'superadmin@organikstore.id',
      passwordHash,
      phone: '0812-9999-0000',
      role: 'superadmin',
      status: 'active',
      joinedDate: '2026-01-10',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'usr-admin-senopati',
      name: 'Budi Store Admin',
      email: 'senopati@organikstore.id',
      passwordHash,
      phone: '0812-1111-2222',
      role: 'admin_store',
      status: 'active',
      assignedStoreId: 'store-1',
      assignedStoreName: 'OrganikStore Cabang Senopati',
      joinedDate: '2026-02-15',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'usr-customer-1',
      name: 'Siti Rahma',
      email: 'siti@gmail.com',
      passwordHash: await bcrypt.hash('customer123', 10),
      phone: '0812-8888-9999',
      role: 'customer',
      status: 'active',
      joinedDate: '2026-03-01',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
  }
  console.log('✅ Users seeded.');

  // 4. Seed Products
  const products = [
    {
      id: 'prod-1',
      name: 'Bayam Hijau Organik Petik Segar',
      categoryId: 'cat-1',
      categorySlug: 'sayur-segar',
      storeId: 'store-1',
      price: 12500,
      originalPrice: 15000,
      discountTag: '20% OFF',
      stock: 65,
      unit: 'per 250g',
      badge: 'TERLARIS',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
      description: 'Bayam hijau bebas pestisida dipetik langsung dari kebun organik tersertifikasi.',
      rating: 4.9,
      reviewCount: 42,
    },
    {
      id: 'prod-2',
      name: 'Apel Fuji Organik Manis Krispi',
      categoryId: 'cat-2',
      categorySlug: 'buah-organik',
      storeId: 'store-1',
      price: 34900,
      originalPrice: 42000,
      discountTag: '17% OFF',
      stock: 40,
      unit: 'per 1 kg',
      badge: 'FRESH',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
      description: 'Apel fuji pilihan bertekstur krispi dengan rasa manis alami tanpa bahan pengawet.',
      rating: 4.8,
      reviewCount: 29,
    },
    {
      id: 'prod-3',
      name: 'Daging Ayam Kampung Segar Organik',
      categoryId: 'cat-3',
      categorySlug: 'daging-ayam',
      storeId: 'store-1',
      price: 58000,
      originalPrice: 65000,
      discountTag: '10% OFF',
      stock: 25,
      unit: 'per ekor (800g)',
      badge: 'ORGANIK',
      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
      description: 'Daging ayam kampung organik dipelihara secara alami bebas hormon pertumbuhan.',
      rating: 4.9,
      reviewCount: 18,
    },
    {
      id: 'prod-4',
      name: 'Telur Ayam Negeri Organik Omega-3',
      categoryId: 'cat-4',
      categorySlug: 'susu-telur',
      storeId: 'store-1',
      price: 28500,
      originalPrice: 32000,
      discountTag: '11% OFF',
      stock: 50,
      unit: 'per 10 butir',
      badge: 'HIGH OMEGA 3',
      image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      description: 'Telur kaya omega-3 dari peternakan organik bersertifikat sehat.',
      rating: 4.7,
      reviewCount: 35,
    },
    {
      id: 'prod-5',
      name: 'Bawang Putih Tunggal Organik',
      categoryId: 'cat-5',
      categorySlug: 'bumbu-dapur',
      storeId: 'store-1',
      price: 24000,
      originalPrice: 28000,
      discountTag: '14% OFF',
      stock: 30,
      unit: 'per 250g',
      badge: 'SUPER',
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80',
      description: 'Bawang putih lanang/tunggal murni berkasiat tinggi untuk kesehatan.',
      rating: 4.9,
      reviewCount: 19,
    },
    {
      id: 'prod-6',
      name: 'Tomat Ceri Hidroponik Manis Kemang',
      categoryId: 'cat-1',
      categorySlug: 'sayur-segar',
      storeId: 'store-2',
      price: 22000,
      originalPrice: 26000,
      discountTag: '15% OFF',
      stock: 45,
      unit: 'per 300g',
      badge: 'CABANG KEMANG',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      description: 'Tomat ceri merah segar jus manis hidroponik khas cabang Kemang.',
      rating: 4.9,
      reviewCount: 15,
    },
    {
      id: 'prod-7',
      name: 'Wortel Brastagi Segar Gading',
      categoryId: 'cat-1',
      categorySlug: 'sayur-segar',
      storeId: 'store-3',
      price: 18500,
      originalPrice: 22000,
      discountTag: '15% OFF',
      stock: 70,
      unit: 'per 500g',
      badge: 'CABANG KELAPA GADING',
      image: 'https://images.unsplash.com/photo-1598170845058-12f6a6a5ce37?auto=format&fit=crop&w=800&q=80',
      description: 'Wortel Brastagi manis dan kaya vitamin A segar langsung dari cabang Kelapa Gading.',
      rating: 4.8,
      reviewCount: 21,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log('✅ Products seeded.');

  // 5. Seed Orders
  const orders = [
    {
      id: 'ord-102',
      orderNo: '#ORD-102',
      customerId: 'usr-customer-1',
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
      shippingAddress: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
      storeId: 'store-1',
      itemsJson: JSON.stringify([
        { productName: 'Bayam Organik Lokal', quantity: 2, price: 15000, unit: '/ikat' },
        { productName: 'Tomat Ceri Manis', quantity: 1, price: 22000, unit: '/pak' },
      ]),
      subtotal: 52000,
      shippingFee: 10000,
      discountAmount: 0,
      totalPrice: 62000,
      paymentMethod: 'QRIS / Instant E-Wallet',
      paymentStatus: 'paid',
      orderStatus: 'new',
      orderTime: '10:15 WIB',
      orderDate: '2026-07-30',
    },
    {
      id: 'ord-103',
      orderNo: '#ORD-103',
      customerId: 'usr-customer-1',
      customerName: 'Rina Wijaya',
      customerPhone: '081398765432',
      shippingAddress: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
      storeId: 'store-1',
      itemsJson: JSON.stringify([
        { productName: 'Alpukat Mentega Super', quantity: 1, price: 35000, unit: '/kg' },
        { productName: 'Apel Fuji Segar', quantity: 1, price: 28000, unit: '/kg' },
      ]),
      subtotal: 63000,
      shippingFee: 10000,
      discountAmount: 0,
      totalPrice: 73000,
      paymentMethod: 'BCA Virtual Account',
      paymentStatus: 'paid',
      orderStatus: 'new',
      orderTime: '10:30 WIB',
      orderDate: '2026-07-30',
    },
    {
      id: 'ord-104',
      orderNo: '#ORD-104',
      customerId: 'usr-customer-1',
      customerName: 'Ahmad Yani',
      customerPhone: '085712345678',
      shippingAddress: 'Jl. Gatot Subroto Kav. 5, Jakarta Selatan',
      storeId: 'store-1',
      itemsJson: JSON.stringify([
        { productName: 'Daging Sapi Grass-fed', quantity: 1, price: 75000, unit: '/pak' },
      ]),
      subtotal: 75000,
      shippingFee: 10000,
      discountAmount: 0,
      totalPrice: 85000,
      paymentMethod: 'COD (Bayar di Tempat)',
      paymentStatus: 'pending',
      orderStatus: 'new',
      orderTime: '10:45 WIB',
      orderDate: '2026-07-30',
    },
    {
      id: 'ord-101',
      orderNo: '#ORD-101',
      customerId: 'usr-customer-1',
      customerName: 'Susi Susanti',
      customerPhone: '081987654321',
      shippingAddress: 'Gedung Sudirman Plaza Lt. 12, Jakarta Pusat',
      storeId: 'store-1',
      itemsJson: JSON.stringify([
        { productName: 'Kentang Dieng Unggul', quantity: 1, price: 22000, unit: '/pak' },
      ]),
      subtotal: 22000,
      shippingFee: 10000,
      discountAmount: 0,
      totalPrice: 32000,
      paymentMethod: 'BCA Virtual Account',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      orderTime: '09:30 WIB',
      orderDate: '2026-07-30',
    },
  ];

  for (const ord of orders) {
    await prisma.order.upsert({
      where: { id: ord.id },
      update: ord,
      create: ord,
    });
  }
  console.log('✅ Orders seeded.');

  // 6. Seed Promo Banners
  const promos = [
    {
      id: 'promo-1',
      title: 'Diskon Organik 30% OFF',
      subtitle: 'Khusus Produk Sayuran Segar Hari Ini',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      badgeText: '30% OFF',
      targetCategory: 'sayur-segar',
      discountCode: 'ORGANIK30',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      isActive: true,
    },
    {
      id: 'promo-2',
      title: 'Gratis Ongkir Super Hemat',
      subtitle: 'Minimal Pembelian Rp 50.000 Ke Seluruh Wilayah',
      imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'FREE ONGKIR',
      discountCode: 'FREESHIP',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      isActive: true,
    },
  ];

  for (const promo of promos) {
    await prisma.promoBanner.upsert({
      where: { id: promo.id },
      update: promo,
      create: promo,
    });
  }
  console.log('✅ Promo Banners seeded.');

  // 7. Seed Shipping Options
  const shippingOptions = [
    {
      id: 'ship-1',
      code: 'instant-senopati',
      name: 'Instant Delivery Senopati (1 Jam)',
      courier: 'GoSend Instant',
      estimatedTime: 'Tiba Hari Ini',
      baseFee: 15000,
      storeId: 'store-1',
      isActive: true,
    },
    {
      id: 'ship-2',
      code: 'nextday-senopati',
      name: 'Express Next Day Senopati',
      courier: 'SiCepat BEST',
      estimatedTime: 'Tiba Besok',
      baseFee: 10000,
      storeId: 'store-1',
      isActive: true,
    },
    {
      id: 'ship-3',
      code: 'express-kemang',
      name: 'Kurir Kilat Kemang (45 Menit)',
      courier: 'GrabExpress Sameday',
      estimatedTime: '45 Menit Tiba',
      baseFee: 18000,
      storeId: 'store-2',
      isActive: true,
    },
    {
      id: 'ship-4',
      code: 'kurir-gading',
      name: 'Kurir Cabang Kelapa Gading',
      courier: 'OrganikStore Fleet',
      estimatedTime: '2 Jam Tiba',
      baseFee: 12000,
      storeId: 'store-3',
      isActive: true,
    },
  ];

  for (const ship of shippingOptions) {
    await prisma.shippingOption.upsert({
      where: { id: ship.id },
      update: ship,
      create: ship,
    });
  }
  console.log('✅ Shipping Options seeded.');

  // 8. Seed Payment Options
  const paymentOptions = [
    {
      id: 'pay-1',
      code: 'qris-senopati',
      name: 'QRIS OrganikStore Senopati',
      category: 'GoPay / OVO / ShopeePay',
      type: 'qris',
      accountName: 'OrganikStore Senopati',
      storeId: 'store-1',
      isActive: true,
    },
    {
      id: 'pay-2',
      code: 'bca-senopati',
      name: 'BCA Virtual Account Senopati',
      category: 'Virtual Account',
      type: 'virtual_account',
      accountNo: '883901928301',
      accountName: 'PT OrganikStore Senopati',
      storeId: 'store-1',
      isActive: true,
    },
    {
      id: 'pay-3',
      code: 'qris-kemang',
      name: 'QRIS OrganikStore Kemang',
      category: 'GoPay / DANA / QRIS',
      type: 'qris',
      accountName: 'OrganikStore Kemang',
      storeId: 'store-2',
      isActive: true,
    },
    {
      id: 'pay-4',
      code: 'cod-kemang',
      name: 'COD (Bayar di Tempat Kemang)',
      category: 'Tunai di Tempat',
      type: 'cod',
      storeId: 'store-2',
      isActive: true,
    },
    {
      id: 'pay-5',
      code: 'bca-gading',
      name: 'BCA Virtual Account Kelapa Gading',
      category: 'Virtual Account',
      type: 'virtual_account',
      accountNo: '778899001122',
      accountName: 'PT OrganikStore Gading',
      storeId: 'store-3',
      isActive: true,
    },
  ];

  for (const pay of paymentOptions) {
    await prisma.paymentOption.upsert({
      where: { id: pay.id },
      update: pay,
      create: pay,
    });
  }
  console.log('✅ Payment Options seeded.');

  // 9. Seed System Config
  await prisma.systemConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      announcementActive: true,
      announcementText: '📢 Promo Khusus Hari Ini: Gratis Ongkir Ke Seluruh Wilayah Dengan Min. Pembelian Rp 50.000!',
      platformName: 'OrganikStore Indonesia',
      supportPhone: '0812-3456-7890',
    },
  });
  // 10. Seed Addresses
  const addresses = [
    {
      id: 'addr-1',
      userId: 'usr-customer-1',
      label: 'Rumah',
      fullName: 'Siti Rahmawati',
      phone: '0812-8888-9999',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      streetAddress: 'Jl. Senopati No. 45, RT 02/RW 03',
      landmark: 'Depan Kedai Kopi Senopati',
      latitude: -6.2297,
      longitude: 106.8075,
      isDefault: true,
    },
    {
      id: 'addr-2',
      userId: 'usr-customer-1',
      label: 'Kantor',
      fullName: 'Siti Rahmawati (Kantor)',
      phone: '0812-8888-9999',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      district: 'Tanah Abang',
      postalCode: '10220',
      streetAddress: 'Gedung Sudirman Plaza Lt. 12, Jl. Jend. Sudirman Kav. 76-78',
      landmark: 'Seberang Stasiun Sudirman',
      latitude: -6.2263,
      longitude: 106.8096,
      isDefault: false,
    },
  ];

  for (const addr of addresses) {
    await prisma.address.upsert({
      where: { id: addr.id },
      update: addr,
      create: addr,
    });
  }
  console.log('✅ Addresses seeded.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

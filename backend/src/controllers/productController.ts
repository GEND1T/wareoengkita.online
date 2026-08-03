import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { deleteCloudinaryImage } from '../utils/cloudinaryHelper';

// GET /api/products (Supports storeId, categorySlug, searchQuery)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { storeId, category, search, includeInactive } = req.query;

    const whereClause: any = {};

    // For store front / customer view, only fetch active products by default
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (storeId && storeId !== 'all') {
      whereClause.storeId = String(storeId);
    }
    if (category && category !== 'semua' && category !== 'all') {
      whereClause.categorySlug = String(category);
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          store: {
            select: { name: true, city: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.error('Error fetching products from DB:', dbErr);
      products = [];
    }

    const sanitizeImage = (imgUrl?: string) => {
      if (!imgUrl || imgUrl.startsWith('data:image/') || imgUrl.length > 500) {
        return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
      }
      return imgUrl;
    };

    const sanitizeImagesJson = (jsonStr?: string | null) => {
      if (!jsonStr) return null;
      try {
        const arr = JSON.parse(jsonStr);
        if (Array.isArray(arr)) {
          const sanitized = arr.map((imgUrl: string) => sanitizeImage(imgUrl));
          return JSON.stringify(sanitized);
        }
      } catch {
        // ignore parse error
      }
      return jsonStr;
    };

    const sanitizedProducts = products.map((p) => ({
      ...p,
      image: sanitizeImage(p.image),
      imagesJson: sanitizeImagesJson(p.imagesJson),
    }));

    return res.json({
      success: true,
      data: sanitizedProducts,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        store: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(444).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    if (product.image && (product.image.startsWith('data:image/') || product.image.length > 500)) {
      product.image = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
    }

    return res.json({ success: true, data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products (Admin Store & Superadmin)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      subtitle,
      categoryId,
      categorySlug,
      storeId,
      price,
      originalPrice,
      discountTag,
      stock,
      unit,
      badge,
      image,
      imagesJson,
      description,
      isActive,
      isFreshDaily,
      isOrganicCertified,
      rating,
      reviewCount,
    } = req.body;

    const safeImage = (!image || image.startsWith('data:image/') || image.length > 500)
      ? 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
      : image;

    const newProduct = await prisma.product.create({
      data: {
        name,
        subtitle: subtitle || null,
        categoryId: categoryId || null,
        categorySlug: categorySlug || 'sayur-segar',
        storeId,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discountTag: discountTag || null,
        stock: stock !== undefined ? parseInt(stock) : 0,
        unit: unit || 'per kg',
        badge: badge || null,
        image: safeImage,
        imagesJson: imagesJson || null,
        description: description || subtitle || name,
        rating: rating !== undefined ? parseFloat(rating) : 0,
        reviewCount: reviewCount !== undefined ? parseInt(reviewCount) : 0,
        isFreshDaily: isFreshDaily !== undefined ? Boolean(isFreshDaily) : false,
        isOrganicCertified: isOrganicCertified !== undefined ? Boolean(isOrganicCertified) : false,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        category: true,
        store: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Produk baru berhasil ditambahkan ke katalog!',
      data: newProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      subtitle,
      categoryId,
      categorySlug,
      storeId,
      price,
      originalPrice,
      discountTag,
      stock,
      unit,
      badge,
      image,
      imagesJson,
      description,
      isActive,
      isFreshDaily,
      isOrganicCertified,
    } = req.body;

    const safeImage = (image && (image.startsWith('data:image/') || image.length > 500))
      ? 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
      : image;

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (subtitle !== undefined) updatePayload.subtitle = subtitle;
    if (categorySlug !== undefined) updatePayload.categorySlug = categorySlug;
    if (storeId !== undefined) updatePayload.storeId = storeId;
    if (price !== undefined) updatePayload.price = parseFloat(price);
    if (originalPrice !== undefined) updatePayload.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (discountTag !== undefined) updatePayload.discountTag = discountTag || null;
    if (stock !== undefined) updatePayload.stock = parseInt(stock);
    if (unit !== undefined) updatePayload.unit = unit;
    if (badge !== undefined) updatePayload.badge = badge || null;
    if (safeImage !== undefined) updatePayload.image = safeImage;
    if (imagesJson !== undefined) updatePayload.imagesJson = imagesJson || null;
    if (description !== undefined) updatePayload.description = description;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);
    if (isFreshDaily !== undefined) updatePayload.isFreshDaily = Boolean(isFreshDaily);
    if (isOrganicCertified !== undefined) updatePayload.isOrganicCertified = Boolean(isOrganicCertified);

    // Validate if categoryId exists in DB before linking
    if (categoryId) {
      const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } }).catch(() => null);
      if (existingCategory) {
        updatePayload.categoryId = categoryId;
      }
    }

    let updatedProduct;
    try {
      updatedProduct = await prisma.product.update({
        where: { id },
        data: updatePayload,
        include: {
          category: true,
          store: true,
        },
      });
    } catch (err: any) {
      // Fallback: update without categoryId if foreign key fails
      delete updatePayload.categoryId;
      updatedProduct = await prisma.product.update({
        where: { id },
        data: updatePayload,
        include: {
          store: true,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Data produk berhasil diperbarui!',
      data: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find product image before deleting from DB
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (existingProduct && existingProduct.image) {
      // Automatically delete Cloudinary image asset
      await deleteCloudinaryImage(existingProduct.image);
    }

    await prisma.product.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Produk berhasil dihapus dari katalog.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

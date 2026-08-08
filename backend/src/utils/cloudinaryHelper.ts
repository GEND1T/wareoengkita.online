import { v2 as cloudinary } from 'cloudinary';

// Function to safely delete an asset from Cloudinary by its URL or Public ID
export const deleteCloudinaryImage = async (imageUrl?: string | null) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || cloudName === 'demo') {
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // Extract public_id from Cloudinary URL (e.g. waroengkita_assets/sample)
    // Example URL: https://res.cloudinary.com/ecfyagfq/image/upload/v1785516938/waroengkita_assets/sample.png
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      const publicIdPath = urlParts.slice(uploadIndex + 2).join('/');
      // Remove file extension (.jpg, .png, etc.)
      const publicId = publicIdPath.substring(0, publicIdPath.lastIndexOf('.')) || publicIdPath;

      await cloudinary.uploader.destroy(publicId);
      console.log(`Successfully deleted Cloudinary asset: ${publicId}`);
    }
  } catch (err: any) {
    console.warn('Failed to delete Cloudinary asset:', err?.message || err);
  }
};

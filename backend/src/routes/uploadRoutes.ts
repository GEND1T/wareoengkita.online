import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/upload - Stream Upload image to Cloudinary & return secure_url link
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'File gambar wajib diunggah' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // 1. Authenticated SDK Upload Stream (Uses API Key & Secret - Safe & Signed)
    if (cloudName && apiKey && apiSecret && cloudName !== 'demo') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const uploadOptions: any = {
        folder: 'waroengkita_assets',
        resource_type: 'auto',
      };

      // Optional preset if signed
      if (uploadPreset) {
        uploadOptions.upload_preset = uploadPreset;
      }

      const uploadStream = () =>
        new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(file.buffer);
        });

      try {
        const cloudResult = await uploadStream();
        if (cloudResult && cloudResult.secure_url) {
          return res.json({
            success: true,
            message: 'Gambar berhasil diunggah ke Cloudinary!',
            url: cloudResult.secure_url,
            public_id: cloudResult.public_id,
          });
        }
      } catch (streamErr: any) {
        console.warn('Cloudinary v2 SDK upload stream error:', streamErr?.message || streamErr);
      }
    }

    // 2. Direct Unsigned Upload Fallback (If Upload Preset is configured as Unsigned in Cloudinary Console)
    if (cloudName && uploadPreset) {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      formData.append('file', blob, file.originalname);
      formData.append('upload_preset', uploadPreset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudJson = await cloudRes.json();
      if (cloudJson.secure_url) {
        return res.json({
          success: true,
          message: 'Gambar berhasil diunggah ke Cloudinary!',
          url: cloudJson.secure_url,
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: `Gagal mengunggah ke Cloudinary (${cloudName}). Pastikan 'e-commerce' preset di Cloudinary Console (Settings -> Upload) diatur ke Mode 'Unsigned' atau pastikan API Secret valid.`,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengunggah gambar ke Cloudinary',
    });
  }
});

export default router;

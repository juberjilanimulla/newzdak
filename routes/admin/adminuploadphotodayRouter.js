import { Router } from "express";
import multer from "multer";
import fs, { createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import photodaymodel from "../../model/photodaymodel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// AWS S3 v3 Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../temp");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(ext);
    if (isImage) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
}).single("photo"); // Accept only one image

const adminuploadphotodayRouter = Router();
adminuploadphotodayRouter.post("/:id", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return errorResponse(res, 400, err.message || "Upload error");
    if (!req.files) return errorResponse(res, 400, "No files uploaded");

    try {
      const photoday = await photodaymodel.findById(req.params.id);
      if (!photoday) {
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, "Photo of the day not found");
      }

      // Upload file to S3
      const fileStream = createReadStream(req.file.path);
      const fileName = `${req.params.id}-${Date.now()}-${
        req.file.originalname
      }`;
      const s3Key = `photoofday/${fileName}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: req.file.mimetype,
      });

      await s3.send(uploadCommand);

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      // Save single URL in the string field
      photoday.photo = imageUrl;
      await photoday.save();

      // Remove local file
      fs.unlinkSync(req.file.path);

      return successResponse(res, "Image uploaded successfully", photoday);
    } catch (error) {
      //   console.error("Upload failed:", error.message);
      if (fs.existsSync(req.file?.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 500, "Image upload failed");
    }
  });
});

export default adminuploadphotodayRouter;

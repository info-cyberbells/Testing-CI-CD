import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { connectToDB } from './db.js';
import router from './route/authRoute.js';
import routerChurch from './route/churchRoute.js';
import routerUser from './route/userRoute.js';
import routerUserWeb from './route/userWebRoute.js';
import routerEvent from './route/eventRoute.js';
import routerSermon from './route/sermonRoute.js';
import routersListen from './route/usersListenRoutes.js';
import jesusClickRoutes from './route/jeasusRoutes.js';
import voiceProfileRouter from './route/voiceProfileRoute.js';
import feedbackRouter from './route/feedbackRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
dotenv.config();
app.use(cors());

// Use import.meta.url and fileURLToPath to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer with appropriate limits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set destination based on route
    let uploadPath = path.join(__dirname, 'uploads');
    if (req.path.includes('/events')) {
      uploadPath = path.join(__dirname, 'uploads/events');
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance with adjusted limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    fieldSize: 20 * 1024 * 1024 // 20MB field size limit (for text fields)
  }
});

// Regular express limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads/events')));
app.use('/churchProfile', express.static(path.join(__dirname, 'churchProfile')));

// Instead of using multer as global middleware, make it available for your routes
// You'll need to apply it in each route file that handles file uploads
app.locals.upload = upload;

// Routes
app.use('/api/auth', router);
app.use('/api/church', routerChurch);
app.use('/api/user', routerUser);
app.use('/api', routerUserWeb);
app.use('/api/event', routerEvent);
app.use('/api/sermon', routerSermon);
app.use('/api/listen', routersListen);
app.use('/api/jesusclick', jesusClickRoutes);
app.use('/api/language', voiceProfileRouter);
app.use('/api/feedback', feedbackRouter);

const PORT = process.env.PORT || 5500;

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
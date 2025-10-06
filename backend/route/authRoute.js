import express from 'express';
import { login} from '../controller/authController.js';


const router = express.Router();

// Authentication Routes
router.post('/login', login);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password/:token', resetPassword);
    
export default router;

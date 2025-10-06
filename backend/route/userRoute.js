import express from 'express';

import { addUser, fetchAllUser, detailUser, verifyResetCodeAndChangePassword, getReferralStats, requestResetPassword, getReferralReport, editUser, deleteUser, fetchUserType, countUserByType } from '../controller/userController.js';
import { updateProfile, changePassword, uploadProfileImage, upload, Profile } from '../controller/userProfileController.js';

import { changePasswordWeb, } from '../controller/userProfileWebController.js';

const routerUser = express.Router();

// Authentication Routes
routerUser.post('/add', addUser);

// User Routes
routerUser.get('/fetchAll', fetchAllUser);
routerUser.get('/detail/:id', detailUser);

routerUser.get('/referralReport', getReferralReport);  //find report of referred users

routerUser.get('/referralStats/:referralCode', getReferralStats);

routerUser.delete('/delete/:id', deleteUser);

routerUser.patch('/edit/:id', editUser);

routerUser.post('/resetPassword', requestResetPassword);
routerUser.post('/verifyResetCode', verifyResetCodeAndChangePassword);

routerUser.get('/:type', fetchUserType);

//profile management
// routerUser.get('/profile/:id', viewProfile);
routerUser.patch('/profile-update/:id', upload.single('image'), Profile);
routerUser.patch('/change-password/:id', changePasswordWeb);
routerUser.patch('/profile/:id', uploadProfileImage, updateProfile);
routerUser.get('/counts/:type', countUserByType);
routerUser.patch('/change/password/:id/', changePassword);






export default routerUser;

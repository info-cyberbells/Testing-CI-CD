import express from 'express';

import { addUser, fetchAllUser, detailUser, editUser, deleteUser, fetchUserType} from '../controller/userController.js';

import {  updateProfileWeb, changePasswordWeb, uploadProfileImageWeb } from '../controller/userProfileWebController.js';

const routerUserWeb = express.Router();

// Authentication Routes
routerUserWeb.post('/add', addUser);

// User Routes
routerUserWeb.get('/fetchAll', fetchAllUser);          
routerUserWeb.get('/detail/:id', detailUser);    
routerUserWeb.delete('/delete/:id', deleteUser);    
routerUserWeb.patch('/edit/:id', editUser);      

routerUserWeb.get('/:type', fetchUserType);

//profile management
// routerUser.get('/profile/:id', viewProfile);
routerUserWeb.patch('/profile-update/:id', uploadProfileImageWeb, updateProfileWeb);
routerUserWeb.patch('/change-password/:id', changePasswordWeb);




export default routerUserWeb;

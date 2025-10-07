import express from 'express';
import { addChurch, fetchAllChurch, detailChurch, getSermonDetails, getChurchSpecificStats, getSalvationDetails, getNewUsersDetails, getChurchStats, updateChurch, deleteChurch, getChurchLanguages, countAllChurches } from '../controller/churchController.js';

const routerChurch = express.Router();

// Church Routes
routerChurch.post('/add', addChurch);
routerChurch.get('/fetchAll123', fetchAllChurch);
routerChurch.get('/languages/:id', getChurchLanguages);
routerChurch.get('/detail/:id', detailChurch);
routerChurch.patch('/edit/:id', updateChurch);
routerChurch.get('/count', countAllChurches);

routerChurch.get('/stats', getChurchStats);
routerChurch.get('/adminStats', getChurchSpecificStats);
routerChurch.get('/sermonDetails', getSermonDetails);
routerChurch.get('/newUsersDetails', getNewUsersDetails);
routerChurch.get('/salvationDetails', getSalvationDetails);


routerChurch.delete('/delete/:id', deleteChurch);


export default routerChurch;

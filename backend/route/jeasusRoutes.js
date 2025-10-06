import express from 'express';
import {
    clickJesus,
    getAllJesusClicks,
    getJesusClicksBySermon,
    getJesusClicksByUser
} from '../controller/jeasusController.js';

const router = express.Router();


router.post('/addstatus', clickJesus);


router.get('/getallstatus', getAllJesusClicks);


router.get('/sermon/:sermonId', getJesusClicksBySermon);


router.get('/user/:userId', getJesusClicksByUser);

export default router;

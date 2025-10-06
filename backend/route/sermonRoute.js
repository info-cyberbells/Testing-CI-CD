import express from 'express';
import { addSermon, deleteSermon, getSermons, getSermonCountForUser, getSermonCount, convertSermonDates, updateSermon, checkLiveSermons, getLiveSermon } from '../controller/sermonController.js';

const routerSermon = express.Router();

routerSermon.post('/add', addSermon);
routerSermon.get('/fetchAll', getSermons);

routerSermon.get('/sermonCount', getSermonCount);
routerSermon.get('/sermonCountForUser', getSermonCountForUser);

routerSermon.patch('/edit/:id', updateSermon);
routerSermon.delete('/delete/:id', deleteSermon);

routerSermon.get('/checkLive', checkLiveSermons);
routerSermon.get('/checksermon', getLiveSermon);

routerSermon.post('/convert-sermon-dates', convertSermonDates);






export default routerSermon;






import express from 'express';
import { addEvent, fetchAllEvent, detailEvent, deleteEventImages, updateEvent, deleteEvent, countAllEvents } from '../controller/eventController.js';
import { upload } from '../controller/eventController.js';

const routerEvent = express.Router();

// Event Routes
routerEvent.post('/add', upload.array('images', 5), addEvent); // Allow up to 5 images
routerEvent.post('/deleteImages/:id', deleteEventImages);
routerEvent.get('/fetchAll', fetchAllEvent);
routerEvent.get('/detail/:id', detailEvent);
routerEvent.patch('/edit/:id', upload.array('images', 5), updateEvent);

routerEvent.get('/count', countAllEvents);
routerEvent.delete('/delete/:id', deleteEvent);

export default routerEvent;

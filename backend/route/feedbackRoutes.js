import express from "express";
import { addFeedback, getAllFeedback, deleteFeedback } from "../controller/feedbackController.js";

const feedbackRouter = express.Router();

feedbackRouter.post("/addFeedback", addFeedback);
feedbackRouter.get("/getAllFeedback", getAllFeedback);
feedbackRouter.delete("/deleteFeedback", deleteFeedback);


export default feedbackRouter;

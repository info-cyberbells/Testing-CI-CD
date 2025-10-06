import express from "express";
import {
    createLanguage,
    getAllLanguages,
    deleteLanguage,
    updateLanguage,
} from "../controller/voiceProfileController.js";

const voiceProfileRouter = express.Router();

voiceProfileRouter.post("/addLanguage", createLanguage);
voiceProfileRouter.get("/getAllLanguage", getAllLanguages);
voiceProfileRouter.delete("/delete/:id", deleteLanguage);
voiceProfileRouter.put("/update/:id", updateLanguage);


export default voiceProfileRouter;

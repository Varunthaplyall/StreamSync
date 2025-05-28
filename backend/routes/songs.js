import { Router } from "express";
const router = Router();
import songsController from "../controllers/songs_controller.js";

router.get("/", songsController.getSongs);



export default router;
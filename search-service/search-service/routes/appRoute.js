import express from "express";
import { retrievalFunction } from "../controllers/retrievalFunction.js";
import { embeddata } from "../controllers/embed.js";

const router = express.Router();

router.get('/retrieval', retrievalFunction);
router.get('/embed', embeddata )

export default router;

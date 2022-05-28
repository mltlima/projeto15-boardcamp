import { Router } from "express";

import categoriesRouter from "./categoriesRouter.js";
import customersRouter from "./custumersRouter.js";
import gamesRouter from "./gamesRouter.js";

const router = Router();

router.use(categoriesRouter);
router.use(customersRouter);
router.use(gamesRouter);

export default router;
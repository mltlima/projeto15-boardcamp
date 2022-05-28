import { Router } from "express";

import categoriesRouter from "./categoriesRouter.js";
import customersRouter from "./custumersRouter.js";

const router = Router();

router.use(categoriesRouter);
router.use(customersRouter);

export default router;
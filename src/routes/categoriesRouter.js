import { Router } from 'express';

import validateMiddleware from '../middlewares/validateMiddleware.js';
import categoriesSchema from '../schemas/categoriesSchema.js';
import { addCategory, getCategories } from '../controllers/categoriesController.js';

const categoriesRouter = Router();

categoriesRouter.get("/", getCategories);
categoriesRouter.post("/", validateMiddleware(categoriesSchema), addCategory);

export default categoriesRouter;
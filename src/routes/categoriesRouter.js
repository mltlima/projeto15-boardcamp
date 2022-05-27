import { Router } from 'express';

import validateMiddleware from '../middlewares/validateMiddleware.js';
import categoriesSchema from '../schemas/categoriesSchema.js';
import { addCategory, getCategories } from '../controllers/categoriesController.js';

const categoriesRouter = Router();

categoriesRouter.get("/categories", getCategories);
categoriesRouter.post("/categories", validateMiddleware(categoriesSchema), addCategory);

export default categoriesRouter;
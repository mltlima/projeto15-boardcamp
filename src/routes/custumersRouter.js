import { Router } from 'express';

import { getCustomer, addCustomer, getCustomers, updateCustomer } from '../controllers/customersController.js';
import validateMiddleware from '../middlewares/validateMiddleware.js';
import customersSchema from '../schemas/customersSchema.js';

const customersRouter = Router();

customersRouter.get('/customers', getCustomers);
customersRouter.post('/customers', validateMiddleware(customersSchema), addCustomer);
customersRouter.get('/customers/:id', getCustomer);
customersRouter.put('/customers/:id', validateMiddleware(customersSchema), updateCustomer);

export default customersRouter;
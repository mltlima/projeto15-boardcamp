import { Router } from 'express';

import { getRentals, addRental, returnRental, deleteRental, metrics } from '../controllers/rentalsController.js';
import validateMiddleware from '../middlewares/validateMiddleware.js';
import rentalsSchema from '../schemas/rentalsSchema.js';

const rentalsRouter = Router();

rentalsRouter.get('/rentals', getRentals);
rentalsRouter.post('/rentals', validateMiddleware(rentalsSchema), addRental);
rentalsRouter.post('/rentals/:id/return', returnRental);
rentalsRouter.delete('/rentals/:id', deleteRental);
rentalsRouter.get('/rentals/metrics', metrics);

export default rentalsRouter;
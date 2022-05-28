import { Router } from 'express';

import { getGames, addGame } from '../controllers/gamesController.js';
import validateMiddleware from '../middlewares/validateMiddleware.js';
import gamesSchema from '../schemas/gamesSchema.js';

const gamesRouter = Router();

gamesRouter.get('/games', getGames);
gamesRouter.post('/games', validateMiddleware(gamesSchema), addGame);

export default gamesRouter;
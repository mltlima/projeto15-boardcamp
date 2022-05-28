import joi from 'joi';

const gamesSchema = joi.object().keys({
    name: joi.string().required(),
    image: joi.string().uri().required(),
    stockTotal: joi.string().required(),
    categoryId: joi.number().integer().required(),
    pricePerDay: joi.string().required()
});

export default gamesSchema;
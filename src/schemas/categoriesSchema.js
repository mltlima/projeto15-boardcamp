import joi from 'joi';

const categoriesSchema = joi.object().keys({
    name: joi.string().required()
});

export default categoriesSchema;
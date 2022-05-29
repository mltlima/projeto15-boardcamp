import joi from "joi";

const rentalsSchema = joi.object({
    customerId: joi.number(),
    gameId: joi.number(),
    daysRented: joi.string()
});

export default rentalsSchema;
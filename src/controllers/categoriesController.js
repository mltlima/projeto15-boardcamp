import connection from "../db.js";

export async function addCategory(req, res) {
    const { name } = req.body;

    try {
        const category = await connection.query(`SELECT * FROM categories WHERE name = $1`, [name]);

        if (category.rows.length > 0) {
            return res.sendStatus(409);
        }

        await connection.query(`INSERT INTO categories (name) VALUES ($1)`, [name]);
        res.sendStatus(201);    
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getCategories(req, res) {
    //const { limit, offset, order, desc } = req.query;

    try {
        if (req.query.offset){
            const offset = `OFFSET ${req.query.offset}`;
        }

        if (req.query.limit) {
            const limit = `LIMIT ${req.query.limit}`;
        }

        const sortByFilter = {
            id: 1,
            name: 2
        }

        let order = '';

        if (req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]}`;
        }

        if (Boolean(req.query.desc) && req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]} DESC`;
        }

        const categories = await connection.query(`SELECT * FROM categories ${order} ${limit} ${offset}`);
        res.send(categories.rows)

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
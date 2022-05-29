import connection from "../db.js";

export async function getGames(req, res) {
    const { name, offset, limit } = req.query;

    try {
        const sortByFilter = {
            id: 1,
            name: 2,
            image: 3,
            stockTotal: 4,
            categoryId: 5,
            pricePerDay: 6
        }

        let order = '';
        if (req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]}`;
        }

        if (Boolean(req.query.desc) && req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]} DESC`;
        }

        if (name) {
            const games = await connection.query(`SELECT games.*, categories.name AS "categoryName" FROM games
             JOIN categories ON categories.id = games."categoryId" WHERE LOWER games.name 
             LIKE LOWER $1 ${order} LIMIT $2 OFFSET $3`, [`%${name}%`, limit || null, offset || 0]);

             res.send(games.rows);
        } else {
            const games = await connection.query(`SELECT games.*, categories.name AS "categoryName" FROM games
                JOIN categories ON categories.id = games."categoryId" ${order} LIMIT $1 OFFSET $2`, [limit || null, offset || 0]);

                res.send(games.rows);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function addGame(req, res) {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

    try {
        const game = await connection.query(`SELECT * FROM games WHERE name = $1`, [name]);
        if (game.rows.length > 0) {return res.sendStatus(409);}

        const category = await connection.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
        if (category.rows.length === 0) {return res.sendStatus(400);}

        await connection.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay")
         VALUES ($1, $2, $3, $4, $5)`, [name, image, parseInt(stockTotal), categoryId, parseInt(pricePerDay)]);
        
        res.sendStatus(201);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
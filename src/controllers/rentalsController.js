import dayjs from 'dayjs';

import connection from "../db.js";

export async function getRentals (req, res) {
    const { customerId, gameId, offset, limit } = req.query;
    
    try{
        const rentals = await connection.query(`
        SELECT 
            rentals.*,
            jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
            jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
        FROM games 
        JOIN rentals ON games.id = rentals."gameId" 
        JOIN customers ON rentals."customerId" = customers.id
        JOIN categories ON games."categoryId" = categories.id
        LIMIT $1 OFFSET $2
        ;`, [limit || null, offset || 0]);

        if(customerId && gameId) {
            return res.send(rentals.rows.filter(row => row.customerId === parseInt(customerId) && row.gameId === parseInt(gameId)));
        }

        if(customerId || gameId) {
            return res.send(rentals.rows.filter(row => customerId ? row.customerId === parseInt(customerId) : row.gameId === parseInt(gameId)));
        }

        res.send(rentals.rows);
    } catch {
        res.sendStatus(500);
    }
}

export async function addRental(req, res) {
    const { customerId, gameId, daysRented } = req.body;

    const rentDate = dayjs().format('YYYY-MM-DD');
    const returnDate = null;
    const delayFee = null;

    try {
        const stock = await connection.query(`SELECT "delayFee" FROM rentals WHERE "gameId" = $1 `, [gameId]);

        let rentCounter = 0;

        stock.rows.filter(element => element.delayFee === null && rentCounter++);

        const game = await connection.query(`SELECT * FROM games WHERE id = $1`, [gameId]);
        
        if (rentCounter >= game.rows[0].stockTotal) {
            res.sendStatus(400);
        }

        const originalPrice = game.rows[0].pricePerDay * parseInt(daysRented);

        const customer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
        if (customer.rows.length === 0 || game.rows.length === 0) {
            return res.sendStatus(400);
        }

        await connection.query(`INSERT INTO rentals ( "customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee" ) VALUES ( $1, $2, $3, $4, $5, $6, $7 )
        `, [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee])

        res.sendStatus(201);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function returnRental(req, res) {
    const { id } = req.params;

    const returnDate = dayjs().format('YYYY-MM-DD')

    function calculator(rented, days, originalPrice) {
        const difference = Math.ceil(dayjs().diff(rented) / 1000 / 60 / 60 / 24)
        const pricePerDay = originalPrice / days
    
        const differenceDays = difference - days
    
        if (differenceDays >= 0) return 0
    
        return Math.abs(differenceDays * pricePerDay)
    }

    try {
        const rentals = await connection.query(`SELECT * FROM rentals WHERE id = $1`, [id]);

        if (rentals.rows.length === 0) {
            return res.sendStatus(404);
        }

        if (rentals.rows[0].returnDate !== null) {
            return res.sendStatus(400);
        }
            
        const fee = calculator(rentals.rows[0].rentDate, rentals.rows[0].daysRented, rentals.rows[0].originalPrice)

        await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`, [returnDate, fee, id]);

        res.sendStatus(200);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function deleteRental(req, res) {
    const { id } = req.params;

    try {
        const rentals = await connection.query(`SELECT * FROM rentals WHERE id = $1`, [id]);

        if (rentals.rows.length === 0) {
            return res.sendStatus(404);
        }

        if (rentals.rows[0].returnDate !== null) {
            return res.sendStatus(400);
        }
            
        await connection.query("DELETE FROM rentals WHERE id = $1", [id]);

        res.sendStatus(200);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function metrics (req, res) {
    const { startDate, endDate } = req.query;

    let filter = "";

    if (startDate && endDate) {
        filter = `WHERE rentDate BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
        filter = `WHERE rentDate >= '${startDate}'`;
    } else if (endDate) {
        filter = `WHERE rentDate <= '${endDate}'`;
    }

    try {
        let sumRentals = await connection.query(`SELECT SUM ("originalPrice") AS "originalSum",
        sum("delayFee") AS "delaySum", COUNT(id) AS rentals FROM rentals ${filter}`);

        sumRentals.rows.map(rental => ({
            revenue: parseInt(rental.originalSum + rental.delaySum),
            rentals: parseInt(rental.rentals),
            average: Math.round((rental.originalSum + rental.delaySum) / rental.rentals)
        }));

        res.send(sumRentals.rows[0]);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
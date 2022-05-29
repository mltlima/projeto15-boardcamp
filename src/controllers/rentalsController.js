import dayjs from 'dayjs';

import connection from "../db.js";

export async function getRentals (req, res) {
    const { customerId, gameId, status, startDate } = req.query;

    try {
        let offset = "";
        if (req.query.offset) {
            offset = `OFFSET ${req.query.offset}`;
        }

        let limit = "";
        if (req.query.limit) {
            limit = `LIMIT ${req.query.limit}`;
        }

        const sortByFilter = {
            id: 1,
            customerId: 2,
            gameId: 3,
            rentDate: 4,
            daysRented: 5,
            returnDate: 6,
            originalPrice: 7,
            delayFee: 8
        }

        let order = '';
        if (req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]}`;
        }

        if (Boolean(req.query.desc) && req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]} DESC`;
        }

        if (customerId) {
            const rentals = await connection.query({ text: `SELECT rentals.*, "customersId", customers.name AS "customersName",
            games.id AS "gamesId", games.name AS "gamesName", games."categoryId", categories.name AS "categoryName"
            FROM rentals JOIN customers ON customers.id=rentals."customerId" JOIN games ON games.id=rentals."gameId"
            JOIN categories ON categories.id=games."categoryId" WHERE rentals."customerId"=$1 ${order} ${offset} ${limit}`,
            rowMode: 'array' }, [customerId]);
        }

        const games = await connection.query(`SELECT games.id, games."categoryId", games.name AS "name",
            categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id
        `)

        const customers = await connection.query(`SELECT id, name FROM customers`);

        rentals.rows.map(rental => ({
            ...rental, customer: customers.find(customer => customer.id === rental.customerId),
            game: arrGames.find(game => game.id === rental.gameId)
        }))

        res.send(rentals.rows);

    } catch (error) {
        console.log(error);
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
            
        const price = game.rows[0].price * daysRented;

        const customer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
        if (customer.rows.length === 0 || game.rows.length === 0) {
            return res.sendStatus(400);
        }

        await connection.query(`INSERT INTO rentals ( "customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee" ) VALUES ( $1, $2, $3, $4, $5, $6, $7 )
        `, [customerId, gameId, rentDate, daysRented, returnDate, price, delayFee])

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
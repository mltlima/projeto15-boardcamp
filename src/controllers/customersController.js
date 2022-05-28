import dayjs from 'dayjs';

import connection from "../db.js";

export async function getCustomers(req, res) {
    const { cpf } = req.query;

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
            name: 2,
            phone: 3,
            cpf: 4,
            birthday: 5
        }

        let order = '';
        if (req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]}`;
        }

        if (Boolean(req.query.desc) && req.query.order) {
            order = `ORDER BY ${sortByFilter[req.query.order]} DESC`;
        }

        let customers = [];

        if (cpf) {
            customers = await connection.query(`SELECT * FROM customers WHERE cpf LIKE $1`, [`${cpf}%`]);

            customers.rows.map(customer => ({
                ...customer, birthday: dayjs(customer.birthday).format('DD/MM/YYYY')
            }))
        }

        customers = await connection.query(`SELECT * FROM customers ${order} ${limit} ${offset}`);
        customers.rows.map(customer => ({
            ...customer, birthday: dayjs(customer.birthday).format('DD/MM/YYYY')
        }))

        res.send(customers.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function addCustomer(req, res) {
    const { name, phone, cpf, birthday } = req.body;

    try {
        const customer = await connection.query(`SELECT * FROM customers WHERE cpf = $1`, [cpf]);

        if (customer.rows.length > 0) {
            return res.sendStatus(409);
        }

        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`, [name, phone, cpf, birthday]);
        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getCustomer(req, res) {
    const { id } = req.params;

    try {
        const customer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);

        if (customer.rows.length === 0) {
            return res.sendStatus(404);
        }

        customer.rows.map(i => ({
            ...i, birthday: dayjs(i.birthday).format('DD/MM/YYYY')
        }))

        res.send(customer.rows[0]);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function updateCustomer(req, res) {
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;

    try {
        await connection.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`, [name, phone, cpf, dayjs(birthday).format('YYYY-MM-DD'), id]);
        res.sendStatus(400);        
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
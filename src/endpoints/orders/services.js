import { DatabaseOrServerError } from "../../error_classes/defined_errors.js";
import pool from "../utils/db.js";

export async function insertWriter({
    writer_id,
    sample_url,
    price_per_page
}) {
    try {
        const result = await pool.query(
            `
            INSERT INTO writers
            (writer_id, sample_url, price_per_page)
            VALUES ($1,$2,$3)

            RETURNING writer_id;
            `,
            [writer_id, sample_url, price_per_page]
        );

        if (!result.rowCount)
            throw new DatabaseOrServerError();
    }
    catch (err) {
        console.log(err);
        throw new DatabaseOrServerError();
    }
}

export async function updateWriter(writer_id, sample_url, price_per_page){
    try{
        const result = await pool.query(
            `
            UPDATE writers
            SET
                sample_url = $2,
                price_per_page = $3

            WHERE writer_id = $1

            RETURNING writer_id;
            `,
            [writer_id, sample_url, price_per_page]
        );

        if (!result.rowCount)
            throw new DatabaseOrServerError();
    }
    catch (err) {
        console.log(err);
        throw new DatabaseOrServerError();
    }
}

export async function fetchAllWriters() {
    try {
        const result = await pool.query(
            `
            SELECT 
                w.writer_id,
                w.sample_url,
                w.price_per_page,
                w.rating,
                u.username,
                u.pfp
            FROM writers w

            JOIN users u
            ON
                w.writer_id = u.id

            ORDER BY w.writer_id

            LIMIT 100;
            `
        );

        return result.rows;
    }
    catch (err){
        console.log(err);
        throw new DatabaseOrServerError();
    }
}

export async function getWriter(user_id, writer_id){
    try{
        const result = await pool.query(
            `
            SELECT
                w.*,
                (
                    SELECT COUNT(*)
                    FROM assignments a

                    WHERE a.customer_id = w.writer_id
                ) AS assignments_created,
                u.username,
                u.pfp,
                u.about,
                u.department
            FROM writers w

            JOIN users u
            ON
                w.writer_id = u.id

            WHERE w.writer_id = $1;
            `,
            [writer_id]
        );

        if (!result.rowCount)
            return null;

        if (user_id != writer_id){
            const {
                assignments_delivered,
                assignments_created,
                ...temp
            } = result.rows[0]

            return { am_i_this_writer: false, ...temp };
        }

        return { am_i_this_writer: true, ...result.rows[0] }
    }
    catch (err){
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function updateAvailability(writer_id, available){
    try{
        const result = await pool.query(
            `
            UPDATE writers
            SET
                available = $2

            WHERE writer_id = $1

            RETURNING 1;
            `,
            [writer_id, available]
        );

        if (!result.rowCount)
            return false;

        return true;
    }
    catch (err){
        console.error("Unexpected DB error for user", writer_id, err);
        throw new DatabaseOrServerError();
    }
}
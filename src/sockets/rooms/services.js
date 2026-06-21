import pool from "../../endpoints/utils/db.js";
import { DatabaseOrServerError } from "../../error_classes/defined_errors.js";

export async function isRoomMember(room_id, user_id) {
    try {
        const db_res = await pool.query(
            `
            SELECT
                r_id
            FROM room_members

            WHERE (
                r_id = $1 
                AND 
                user_id = $2
            );
            `,
            [room_id, user_id]
        );

        return db_res.rowCount !== 0;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function saveRoomMessage(room_id, user_id, message_form) {
    const db_instance = await pool.connect();

    try {
        await db_instance.query('BEGIN');

        const msg_id_res = await db_instance.query(
            `
            INSERT INTO room_messages
                (r_id, user_id, message)
            
            VALUES
                ($1, $2, $3)

            RETURNING
                message_id,
                sent_at;
            `,
            [room_id, user_id, message_form.text]
        );

        if (!msg_id_res.rowCount) {
            await db_instance.query('ROLLBACK');
            throw new DatabaseOrServerError();
        }

        const message_id = msg_id_res.rows[0].message_id;
        const timestamp = msg_id_res.rows[0].sent_at;

        const file_vals = [message_id];
        const query_placeholders = [];

        let next_free_param = 2;

        for (const file of message_form.files_list){
            file_vals.push(file.filename);
            file_vals.push(file.file_url);
            file_vals.push(file.mime_type);

            query_placeholders.push(
                `($1, $${next_free_param}, $${next_free_param + 1}, $${next_free_param + 2})`
            );

            next_free_param += 3;
        }

        if (message_form.files_list.length > 0) {
            const file_res = await db_instance.query(
                `
                INSERT INTO room_message_files
                    (message_id, filename, file_url, mime_type)

                VALUES
                    ${query_placeholders.join(', ')}

                RETURNING 1;
                `,
                file_vals
            );

            if (!file_res.rowCount) {
                await db_instance.query('ROLLBACK');
                throw new DatabaseOrServerError();
            }
        }

        await db_instance.query('COMMIT');

        return { message_id, timestamp };
    }
    catch (err) {
        await db_instance.query('ROLLBACK');
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
    finally {
        db_instance.release();
    }
}
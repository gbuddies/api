import { DatabaseOrServerError, InvalidUser } from "../../error_classes/defined_errors.js";
import pool from "../utils/db.js";
import UMS from "./UMS.js";

export async function getGlobalChats(user_id, last_seen_msg) {
    try {
        const res = await pool.query(
            `
            SELECT
                m.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'filename', mf.filename,
                            'file_url', mf.file_url
                        ) ORDER BY mf.file_id ASC
                    ) FILTER (WHERE mf.file_id IS NOT NULL),
                    '[]'::json
                ) as files,
                u.username,
                u.pfp
            FROM messages m

            LEFT JOIN message_files mf
            ON
                m.id = mf.id

            JOIN users u
            ON
                m.user_id = u.id

            WHERE m.id < $1

            GROUP BY
                m.id,
                u.id

            ORDER BY m.id ASC

            LIMIT 100;
            `,
            [last_seen_msg]
        );

        return res.rows.map(msg => UMS.globalMessage(msg));
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getRoomMessages(user_id, room_id, last_seen) {
    try {
        const result = await pool.query(
            `
            SELECT
                rm.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'filename', rmf.filename,
                            'file_url', rmf.file_url,
                            'mime_type', rmf.mime_type
                        ) ORDER BY rmf.file_id ASC
                    ) FILTER (WHERE rmf.file_id IS NOT NULL),
                    '[]'::json
                ) AS files,
                u.username,
                u.pfp
            FROM room_messages rm

            LEFT JOIN room_message_files rmf
            ON
                rm.message_id = rmf.message_id
            
            JOIN users u
            ON
                rm.user_id = u.id

            WHERE (
                rm.r_id = $1
                AND
                rm.message_id < $2
            )

            GROUP BY
                rm.message_id,
                u.id

            ORDER BY rm.message_id ASC

            LIMIT 100;
            `,
            [room_id, last_seen]
        );

        const ums = result.rows.map(msg => UMS.roomMessage(msg));

        return ums;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getContacts(user_id) {
    try {
        const result = await pool.query(
            `
            SELECT DISTINCT ON (c.contact_id)
                c.contact_id,
                CASE
                    WHEN c.person1 = $1 THEN c.person2
                    ELSE c.person1
                END AS other_id,

                dm.message AS recent_message,
                dm.sent_by,
                dm.sent_at,
                u.username,
                u.pfp
            FROM contacts c

            LEFT JOIN direct_messages dm
            ON
                dm.contact_id = c.contact_id

            JOIN users u
            ON
                u.id = CASE
                WHEN c.person1 = $1 THEN c.person2
                ELSE c.person1
            END

            WHERE (
                c.person1 = $1
                OR
                c.person2 = $1
            )

            ORDER BY c.contact_id, dm.sent_at DESC;
            `,
            [user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.log("Unexpected DB error for user", user_id);
        throw new DatabaseOrServerError();
    }
}

export async function getChats(user_id, contact_id, last_seen_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                dm.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'filename', dmf.filename,
                            'file_url', dmf.file_url
                        ) ORDER BY dmf.file_id ASC
                    ) FILTER (WHERE dmf.file_id IS NOT NULL),
                    '[]'::json
                ) AS files,
                u.username,
                u.pfp,
                u.id AS user_id
            FROM direct_messages dm

            LEFT JOIN direct_message_files dmf
            ON
                dm.message_id = dmf.message_id

            JOIN users u
            ON
                dm.sent_by = u.id

            WHERE (
                dm.contact_id = $1
                AND
                dm.message_id < $2
            )

            GROUP BY
                dm.message_id,
                u.id

            ORDER BY dm.message_id ASC

            LIMIT 100;
            `,
            [contact_id, last_seen_id]
        );

        const ums = result.rows.map(msg => UMS.directMessage(msg));

        return ums;
    }
    catch (err) {
        console.log("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function searchContacts(user_id, last_seen_id, query) {
    try {
        const result = await pool.query(
            `
            SELECT DISTINCT ON (c.contact_id)
                c.contact_id,
                CASE
                    WHEN c.person1 = $1 THEN c.person2
                    ELSE c.person1
                END AS other_id,

                dm.message AS recent_message,
                dm.sent_by,
                dm.sent_at,
                u.username,
                u.pfp

            FROM contacts c

            LEFT JOIN direct_messages dm
            ON
                dm.contact_id = c.contact_id

            JOIN users u
            ON u.id = CASE
                WHEN c.person1 = $1 THEN c.person2
                ELSE c.person1
            END

            WHERE (
                (
                    c.person1 = $1
                    OR
                    c.person2 = $1
                )
                AND
                u.username ILIKE $2
                AND
                c.contact_id < $3
            )

            ORDER BY c.contact_id, dm.sent_at DESC

            LIMIT 100;
            `,
            [user_id, query, last_seen_id]
        );

        return result.rows;
    }
    catch (err) {
        console.log("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function createContact(user_id, friend_id) {
    const db_con = await pool.connect();

    try {
        await db_con.query('BEGIN');

        const frnd_res = await db_con.query(
            `
            SELECT
                CASE
                    WHEN user1 = $1 THEN user2
                    ELSE user1
                END AS other_id
            FROM friends

            WHERE friend_id = $2
            `,
            [user_id, friend_id]
        );

        if (!frnd_res.rowCount) {
            throw new InvalidUser();
        }

        const other_id = frnd_res.rows[0].other_id;

        if (other_id === user_id) {
            throw new InvalidUser();
        }

        const contact_res = await db_con.query(
            `
            WITH
                inserted AS (
                    INSERT INTO contacts(person1, person2)
                    VALUES (
                        LEAST($1::INT, $2::INT),
                        GREATEST($1::INT, $2::INT)
                    )

                    ON CONFLICT (
                        LEAST(person1, person2),
                        GREATEST(person1, person2)
                    )
                    DO NOTHING

                    RETURNING contact_id, person1, person2
                ),
                existing AS (
                    SELECT
                        contact_id,
                        person1,
                        person2
                    FROM contacts

                    WHERE (
                        person1 = LEAST($1::INT, $2::INT)
                        AND
                        person2 = GREATEST($1::INT, $2::INT)
                    )
                )

            SELECT
                u.id,
                u.pfp,
                u.username,
                nc.contact_id,
                nc.person1,
                nc.person2
            FROM (
                SELECT *
                FROM inserted

                UNION ALL

                SELECT *
                FROM existing

                LIMIT 1
            ) nc

            JOIN users u
            ON
                u.id = CASE
                    WHEN nc.person1 = $1 THEN nc.person2
                    ELSE nc.person1
                END;
            `,
            [user_id, other_id]
        );

        if (!contact_res.rowCount) {
            console.log("here", contact_res.rowCount);
            throw new DatabaseOrServerError();
        }

        await db_con.query('COMMIT');

        return contact_res.rows[0];
    }
    catch (err) {
        await db_con.query('ROLLBACK');
        console.log("Unexpected DB error for user", user_id, err);

        if (err.is_expected)
            throw err;

        throw new DatabaseOrServerError();
    }
    finally {
        db_con.release();
    }
}
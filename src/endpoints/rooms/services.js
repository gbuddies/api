import {
    DatabaseOrServerError,
    NotFound,
    RoomSizeExceeded
} from "../../error_classes/defined_errors.js";

import pool from "../utils/db.js";

export async function getRooms(constraint, user_id, last_seen_id, room_id) {
    let result;

    try {
        switch (constraint) {
            case '*':
                result = await pool.query(
                    `
                    SELECT
                        r.*,
                        COUNT(rm.user_id) AS popl_size,
                        u.username,
                        EXISTS(
                            SELECT 
                                rm.r_id
                            FROM room_members rm

                            WHERE (
                                rm.user_id = $1
                                AND
                                rm.r_id = r.r_id
                            )
                        ) AS is_member
                    FROM rooms r

                    JOIN users u
                    ON 
                        r.r_aid = u.id

                    LEFT JOIN room_members rm
                    ON
                        r.r_id = rm.r_id

                    WHERE
                        r.r_type = 'public'
                        AND
                        r.r_id < $2

                    GROUP BY r.r_id, u.username

                    ORDER BY r.r_id DESC

                    LIMIT 15
                    `,
                    [user_id, last_seen_id]
                );

                break;

            case 'my':
                result = await pool.query(
                    `
                    SELECT
                        r.*,
                        COUNT(rm.user_id),
                        u.username,
                        EXISTS(
                            SELECT 
                                rm.r_id
                            FROM room_members rm

                            WHERE (
                                rm.user_id = $1
                                AND
                                rm.r_id = r.r_id
                            )
                        ) AS is_member
                    FROM rooms r

                    JOIN users u
                    ON 
                        r.r_aid = u.id

                    LEFT JOIN room_members rm
                    ON
                        r.r_id = rm.r_id

                    WHERE 
                        r.r_aid = $1 
                        OR 
                        rm.user_id = $1
                        AND
                        r.r_id < $2

                    GROUP BY r.r_id, u.username

                    ORDER BY r.r_id DESC

                    LIMIT 15
                    `,
                    [user_id, last_seen_id]
                );

                break;

            case 'a':
                result = await pool.query(
                    `
                    SELECT
                        r.*,
                        COUNT(rm.user_id) AS popl_size,
                        u.username AS admin_name,
                        u.id,
                        u.pfp AS admin_pfp,
                        u.department,
                        u.about,
                        u.phone,
                        u.personal_email
                    FROM rooms r

                    JOIN users u
                    ON 
                        r.r_aid = u.id

                    LEFT JOIN room_members rm
                    ON
                        r.r_id = rm.r_id

                    WHERE r.r_id = $1

                    GROUP BY r.r_id, u.id;
                    `,
                    [room_id]
                );

                if (!result.rowCount)
                    throw new NotFound();

                break;
        }

        return result.rows;
    }
    catch (err) {
        if (err.is_expected)
            throw err;

        console.error("Unexpected DB error for user", user_id, err);
        DatabaseOrServerError();
    }
}

export async function getRoomMembers(room_id, user_id){
    try{
        const result = await pool.query(
            `
            SELECT DISTINCT
                u.id,
                u.username,
                u.department,
                u.pfp
            FROM room_members rm

            JOIN users u
            ON
                rm.user_id = u.id

            WHERE rm.r_id = $1;
            `,
            [room_id]
        );

        return result.rows;
    }
    catch (err){
        console.error("Unexpected DB error for user", user_id, err);
        DatabaseOrServerError();
    }
}

export async function getSearchedRooms(search_query, last_seen_id, user_id) {
    try {
        const search_string = `${search_query}%`;

        const result = await pool.query(
            `
            SELECT
                r.*,
                COUNT(rm.r_id) AS popl_size,
                u.username,
                EXISTS(
                    SELECT 
                        rm.r_id
                    FROM room_members rm

                    WHERE (
                        rm.user_id = $1
                        AND
                        rm.r_id = r.r_id
                    )
                ) AS is_member
            FROM rooms r

            JOIN users u
            ON 
                r.r_aid = u.id

            LEFT JOIN room_members rm
            ON
                r.r_id = rm.r_id

            WHERE
                r.r_name ILIKE $2
                OR
                u.username ILIKE $2
                AND
                r.r_id < $3

            GROUP BY r.r_id, u.username

            ORDER BY r.r_name ASC

            LIMIT 15;
            `,
            [user_id, search_string, last_seen_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function createRoom(user_id, data, room_icon_url) {
    const db_instance = await pool.connect();

    try {
        db_instance.query('BEGIN');

        const room_res = await db_instance.query(
            `
            INSERT INTO rooms
                (r_name, r_desc, r_aid, r_size, r_type, join_pref, icon_url)
            
            VALUES
                ($1, $2, $3, $4, $5, $6, $7)

            RETURNING r_id;
            `,
            [
                data.room_name,
                data.room_desc,
                user_id,
                data.room_size,
                data.room_type,
                data.join_pref,
                room_icon_url
            ]
        );

        const room_id = room_res.rows[0].r_id;

        await db_instance.query(
            `
            INSERT INTO room_members
                (r_id, user_id)

            VALUES
                ($1, $2)
            `,
            [room_id, user_id]
        );

        await db_instance.query('COMMIT');

        return room_id;
    }
    catch (err) {
        db_instance.query('ROLLBACK');

        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
    finally {
        db_instance.release();
    }
}

export async function updateRoom(room_id, user_id, data, room_icon_url){
    try{
        const result = await pool.query(
            `
            UPDATE rooms
            SET
                r_name = COALESCE(NULLIF($1, ''), r_name),
                r_desc = COALESCE(NULLIF($2, ''), r_desc),
                r_size = $3,
                r_type = $4,
                join_pref = $5,
                icon_url = COALESCE(NULLIF($6, '#'), icon_url)

            WHERE (
                r_id = $7
                AND
                r_aid = $8
            )
            
            RETURNING 1;
            `,
            [
                data.room_name,
                data.room_desc,
                data.room_size,
                data.room_type,
                data.join_pref,
                room_icon_url,
                room_id,
                user_id
            ]
        );

        return (result.rowCount !== 0);
    }
    catch (err){
        console.error("Unexpected DB error for user",user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function joinRoom(room_id, user_id){
    try{
        const result = await pool.query(
            `
            INSERT INTO room_members 
                (r_id, user_id)

            SELECT $1::INT, $2
            FROM rooms r

            LEFT JOIN room_members rm
            ON
                r.r_id = rm.r_id

            WHERE (
                r.join_pref = 'Anyone Can Join'
                AND
                r.r_id = $1
            )

            GROUP BY r.r_id, r.r_size

            HAVING COUNT(rm.user_id) < r.r_size;
            `,
            [room_id, user_id]
        );

        if (!result.rowCount)
            throw new RoomSizeExceeded();

        return true;
    }
    catch (err){
        if (err.is_expected)
            throw err;

        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function leaveRoom(room_id, user_id){
    try{
        const result = await pool.query(
            `
            DELETE
            FROM room_members

            WHERE (
                r_id = $1
                AND
                user_id = $2
            )

            RETURNING 1;
            `,
            [room_id, user_id]
        );

        if (!result.rowCount)
            throw new DatabaseOrServerError();

        return true;
    }
    catch (err){
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}
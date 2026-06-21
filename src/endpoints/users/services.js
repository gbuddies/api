import {
    DatabaseOrServerError,
    ForbiddenAccess,
    FrndReqTransactionFailed,
    InvalidUser,
    NotFound
} from "../../errors/defined_errors.js";

import pool from "../utils/db.js";

export async function getUser(user_id, req_user_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.username,
                u.pfp,
                u.department,
                u.about,
                u.phone,
                u.personal_email,
                f.friend_id,
                (f.friend_id IS NOT NULL) AS is_friend

            FROM users u

            LEFT JOIN friends f
            ON (
                f.user1 = LEAST($2, u.id)
                AND
                f.user2 = GREATEST($2, u.id)
            )

            WHERE u.id = $1;
            `,
            [req_user_id, user_id]
        );

        return result.rows[0];
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function saveUserDetails(id, data) {
    try {
        const result = await pool.query(
            `
            UPDATE users
            SET
                pfp = $1,
                username = $2,
                department = $3,
                about = $4,
                phone = $5,
                personal_email = $6

            WHERE id = $7

            RETURNING id;
            `,
            [
                data.pfp || null,
                data.username || null,
                data.department || null,
                data.about || null,
                data.phone === "" ? null : data.phone,
                data.email || null,
                id
            ]
        );

        if (result.rowCount === 0)
            throw new InvalidUser();

        return true;
    }
    catch (err) {

        if (err.is_expected)
            throw err;

        console.error("Unexpected DB error for user", id, err);
        throw new DatabaseOrServerError();
    }
}

export async function searchUsers(user_id, search_query) {
    try {
        const search_string = `${search_query}%`;

        const result = await pool.query(
            `
            SELECT
                u.id,
                u.username,
                u.pfp,
                EXISTS (
                    SELECT
                        f.friend_id
                    FROM friends f

                    WHERE (
                        f.user1 = LEAST($2, u.id)
                        AND
                        f.user2 = GREATEST($2, u.id)
                    )
                ) AS is_friend
            FROM users u

            WHERE
                username ILIKE $1
                AND
                NOT id = $2
                
            ORDER BY u.username ASC

            LIMIT 15;
            `,
            [search_string, user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function searchFriends(user_id, search_query, last_seen_id) {
    try {
        const search_string = `${search_query}%`;

        const result = await pool.query(
            `
            SELECT
                f.friend_id,
                u.id,
                u.username,
                u.pfp
            FROM friends f

            JOIN users u
            ON
                u.id = CASE
                    WHEN f.user1 = $2 THEN f.user2
                    ELSE f.user1
                END

            WHERE
                u.username ILIKE $1
                AND
                u.id < $3
                AND
                $2 IN (user1, user2)
                
            ORDER BY u.id DESC

            LIMIT 15;
            `,
            [search_string, user_id, last_seen_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function sendFrndReq(sender, receiver) {
    const db_instance = await pool.connect();

    try {
        await db_instance.query('BEGIN');

        const frnd_res = await db_instance.query(
            `
            WITH request_id AS (
                DELETE FROM friend_requests fr
                
                WHERE (
                    sender = $2
                    AND
                    receiver = $1
                )

                RETURNING request_id
            )

            INSERT INTO friends
                (user1, user2)

            SELECT LEAST($1, $2), GREATEST($1, $2)

            WHERE (
                EXISTS (SELECT request_id FROM request_id)
                AND
                NOT EXISTS (
                    SELECT f.friend_id
                    FROM friends f

                    WHERE (
                        user1 = LEAST($1, $2)
                        AND
                        user2 = GREATEST($1, $2)
                    )
                )
            )

            RETURNING friend_id;
            `,
            [sender, receiver]
        );

        let result = null;

        if (frnd_res.rowCount !== 0) {
            console.log("friend req from receiver already exists. Adding to friends");
            await db_instance.query('COMMIT');
        }

        else {
            result = await db_instance.query(
                `
                INSERT INTO friend_requests
                    (sender, receiver)

                SELECT $1, $2

                WHERE NOT EXISTS (
                    SELECT fr.request_id
                    FROM friend_requests fr

                    WHERE (
                        fr.sender = $1
                        AND
                        fr.receiver = $2
                    )
                )

                RETURNING request_id;
                `,
                [sender, receiver]
            );

            if (!result.rowCount)
                throw new FrndReqTransactionFailed();
        }

        await db_instance.query('COMMIT');

        return result.rows[0].request_id;
    }
    catch (err) {
        if (err.is_expected)
            throw err;

        await db_instance.query('ROLLBACK');

        console.error("Unexpected DB error for user", sender, err);
        throw new DatabaseOrServerError();
    }
    finally {
        db_instance.release();
    }
}

export async function acceptFrndReq(request_id, user_id) {
    user_id = Number(user_id);
    request_id = Number(request_id);


    const db_instance = await pool.connect();

    try {
        await db_instance.query('BEGIN');

        const result = await db_instance.query(
            `
            DELETE
            FROM friend_requests

            WHERE (
                request_id = $1
                AND
                receiver = $2
            )

            RETURNING
                sender,
                receiver;
            `,
            [request_id, user_id]
        );

        const user1 = Number(result.rows[0]?.receiver);
        const user2 = Number(result.rows[0]?.sender);

        if (!user1 || !user2)
            throw new FrndReqTransactionFailed();

        if (user1 !== user_id)
            throw new ForbiddenAccess();

        const friend_result = await db_instance.query(
            `
            INSERT INTO friends
                (user1, user2)

            VALUES (
                LEAST($1::int, $2::int),
                GREATEST($1::int, $2::int)
            )
                
            RETURNING friend_id;
            `,
            [user1, user2]
        );

        if (!friend_result.rowCount)
            throw new FrndReqTransactionFailed();

        await db_instance.query('COMMIT');

        return friend_result.rows[0].friend_id;
    }
    catch (err) {
        await db_instance.query('ROLLBACK');

        if (err.is_expected)
            throw err;

        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
    finally {
        db_instance.release();
    }
}

export async function rejectFrndReq(request_id, user_id) {
    try {
        const result = await pool.query(
            `
            DELETE FROM friend_requests
            WHERE (
                request_id = $1
                AND
                receiver = $2
            )
            
            RETURNING request_id;
            `,
            [request_id, user_id]
        );

        return result.rows[0]?.request_id;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getSentFrndReqs(user_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                fr.request_id,
                fr.sender AS user_id,
                fr.receiver AS receiver_id,
                u.username AS receiver_name,
                u.pfp AS receiver_pfp,
                fr.sent_at
            FROM friend_requests fr

            JOIN users u
            ON
                fr.receiver = u.id

            WHERE sender = $1

            ORDER BY request_id DESC

            LIMIT 15;
            `,
            [user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getRecFrndReqs(user_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                fr.request_id,
                fr.sender AS sender_id,
                u.username AS sender_name,
                u.pfp AS sender_pfp,
                fr.receiver AS user_id,
                fr.sent_at
            FROM friend_requests fr

            JOIN users u
            ON
                fr.sender = u.id

            WHERE receiver = $1
            
            ORDER BY request_id DESC

            LIMIT 15;
            `,
            [user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getFriends(user_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                f.friend_id,
                u.id,
                u.username,
                u.pfp
            FROM friends f

            JOIN users u
            ON
                u.id = CASE
                    WHEN f.user1 = $1 THEN f.user2
                    ELSE f.user1
                END

            WHERE (
                f.user1 = $1
                OR
                f.user2 = $1
            )
            
            ORDER BY u.username ASC

            LIMIT 15;
            `,
            [user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function removeFriend(friend_id, user_id) {
    try {
        const result = await pool.query(
            `
            DELETE FROM friends

            WHERE friend_id = $1

            RETURNING 1;
            `,
            [friend_id]
        );

        if (!result.rowCount)
            throw new FrndReqTransactionFailed();

        return result.rows[0];
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}

export async function getRecentFriends(user_id) {
    try {
        const result = await pool.query(
            `
            SELECT
                f.friend_id,
                u.id AS other_id,
                u.username,
                u.pfp
            FROM friends f

            JOIN users u
            ON
                U.id = CASE
                    WHEN f.user1 = $1 THEN f.user2
                    ELSE f.user1
                END

            WHERE $1 IN (user1, user2)

            ORDER BY f.connected_at DESC

            LIMIT 8;
            `,
            [user_id]
        );

        return result.rows;
    }
    catch (err) {
        console.error("Unexpected DB error for user", user_id, err);
        throw new DatabaseOrServerError();
    }
}
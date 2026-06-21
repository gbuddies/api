import bcrypt from 'bcrypt';
import pool from '../utils/db.js';
import {
    DatabaseOrServerError,
    DBIntegrityError,
    DuplicateUser,
    InvalidOTP,
    InvalidUser,
    OTPNotFound,
    RegistrationFailed
} from '../../error_classes/defined_errors.js';

export async function registerUser({ username, email, password }) {
    try {
        const pswd_hashed = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
            INSERT INTO users (username, email, password)
            VALUES
                ($1, $2, $3)

            ON CONFLICT (email)
            DO
                UPDATE
                SET
                    username = EXCLUDED.username,
                    password = EXCLUDED.password,
                    is_verified = false

                WHERE users.is_verified = false
            
            RETURNING id, email;
        `,
            [username, email, pswd_hashed]
        );

        if (!result.rowCount)
            throw new DuplicateUser() // duplicate user

        return result.rows[0];
    }
    catch (err) {
        console.error("Unexpected error in registerUser:", err);

        if (err.code === '23505')
            console.log(err);

        if (err.is_expected)
            throw err;

        throw new DatabaseOrServerError() // other error
    }
}

export async function authorizeUser({ email, password }) {
    try {
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.email,
                u.password
            FROM users u
            
            WHERE (
                u.email = $1
                AND
                u.is_verified = true
            );
            `,
            [email]
        );

        if (result.rowCount === 0)
            throw new InvalidUser();

        if (result.rowCount > 1) {
            console.error("Data integrity issue: duplicate emails found", email);
            throw new DBIntegrityError();
        }

        const check = await bcrypt.compare(password, result.rows[0].password);

        if (!check)
            throw new InvalidUser();

        return { id: result.rows[0].id, email: result.rows[0].email };
    }
    catch (err) {
        if (err.is_expected)
            throw err;

        console.error("Unexpected error in authorizeUser:", err);
        throw new DatabaseOrServerError();
    }
}

export const verifyOtpService = async (email, otp) => {
    const db_instance = await pool.connect();

    try{
        await db_instance.query('BEGIN');

        const otp_res = await db_instance.query(
            `
            SELECT otp
            FROM otp

            WHERE (
                email = $1
                AND
                expires_at > NOW()
            )

            FOR UPDATE;
            `,
            [email]
        );

        if (!otp_res.rowCount)
            throw new OTPNotFound();

        const otp_val = otp_res.rows[0].otp;

        if (!await bcrypt.compare(String(otp), otp_val))
            throw new InvalidOTP();

        await db_instance.query(
            `
            DELETE FROM otp
            WHERE email = $1;
            `,
            [email]
        );

        const result = await db_instance.query(
            `
            UPDATE users
            SET
                is_verified = true
            
            WHERE email = $1

            RETURNING 1;
            `,
            [email]
        );

        if (result.rowCount){
            await db_instance.query('COMMIT');
            return true;
        }
        else{
            throw new DBIntegrityError();
        }
    }
    catch (err){
        console.error(err);
        await db_instance.query('ROLLBACK');

        if (err.is_expected) throw err;

        throw new DatabaseOrServerError();
    }
    finally{
        db_instance.release();
    }
};

export async function storeOtp(otp, email) {
    try {
        const otp_hashed = await bcrypt.hash(String(otp), 10);

        const result = await pool.query(
            `
            INSERT INTO otp
                (email, otp, expires_at)
            
            VALUES
                ($1, $2, NOW() + INTERVAL '5 minutes')

            ON CONFLICT (email)
            DO
                UPDATE
                SET
                    otp = EXCLUDED.otp,
                    expires_at = EXCLUDED.expires_at;
            `,
            [email, otp_hashed]
        );

        return true;
    }
    catch (err) {
        console.error("Unexpected DB error for user", email, err);
        throw new DatabaseOrServerError();
    }
}
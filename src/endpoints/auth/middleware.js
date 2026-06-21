import checkPasswordStrength from "../../tools/pswd_strength.js";
import jwt from 'jsonwebtoken';
import {
    InvalidEmail,
    InvalidJWT,
    MissingData,
} from "../../error_classes/defined_errors.js";

export function validateRegUser(req, res, next) {
    const { username, email, password } = req.body;

    // Check for empty fields
    if (!username || !email || !password) {
        throw new MissingData();
    }

    // Verify email
    if (!(/^[a-zA-Z\d._%+-]+@(([a-z]+\.)?gitam\.(in|edu))$/u.test(email))) {
        throw new InvalidEmail();
    }

    // Password strentgh
    const pswd_strength = checkPasswordStrength(password);

    if (!pswd_strength.ok) {
        throw new pswd_strength.error;
    }

    next();
}

export function validateLoginUser(req, res, next) {
    const { email, password } = req.body;

    // Check for empty fields
    if (!email || !password) {
        throw new MissingData();
    }

    // Verify email
    if (!(/^[a-zA-Z\d._%+-]+@(([a-z]+\.)?gitam\.(in|edu))$/u.test(email))) {
        throw new InvalidEmail();
    }

    next();
}

export function authorizeToken(req, res, next) {
    const auth_token = req.headers.auth_token;

    if (!auth_token) {
        throw new InvalidJWT();
    }

    const token = auth_token.split(" ")[1];

    if (!token) {
        throw new InvalidJWT();
    }

    try {
        req.requesting_user = jwt.verify(token, process.env.JWT_SECRET);
        req.requesting_user.id = Number(req.requesting_user.id);
    }
    catch (err) {
        throw new InvalidJWT();
    }

    next();
}
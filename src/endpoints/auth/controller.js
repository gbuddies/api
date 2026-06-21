import {
    authorizeUser,
    registerUser
} from './services.js';

import jwt from 'jsonwebtoken';
import { verifyOtpService, storeOtp } from "./services.js";
import crypto from "crypto";
import { RegistrationFailed } from '../../error_classes/defined_errors.js';
import { transporter } from '../utils/mailer.js';

export async function handleUserReg(req, res, next) {
    try {
        const user = await registerUser(req.body);

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            success: true,
            token,
            user
        });
    }
    catch (err) { next(err) }
}

export async function handleUserLogin(req, res, next) {
    try {
        const user = await authorizeUser(req.body);

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            success: true,
            token,
            user
        });
    }
    catch (err) { next(err) }
}

export const verifyOtp = async (req, res, next) => {
    try {
        const email = req.requesting_user.email;
        const { otp } = req.body;

        const result = await verifyOtpService(email, otp);

        return res.status(200).json({
            success: result
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const sendOtp = async (req, res, next) => {
    try {
        const email = req.requesting_user.email;

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999);

        const status = await storeOtp(otp, email);

        if (!status) {
            throw new RegistrationFailed();
        }

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Your G-Connect OTP Code",
            text: `Hello,

            Your One-Time Password (OTP) for verifying your G-Connect account is:
            ${otp}

            This code is valid for the next 5 minutes. Please do not share this code with anyone.

            If you did not request this, you can safely ignore this email.

            - G-Connect Team`
        });

        res.status(201).json({ success: true });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

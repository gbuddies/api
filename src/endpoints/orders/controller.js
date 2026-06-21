import { InvalidData } from "../../error_classes/defined_errors.js";
import {
    getWriter,
    insertWriter,
    updateAvailability,
    updateWriter
} from "./orders.query.js";

import { fetchAllWriters } from "./orders.query.js";

export async function createWriter(req, res, next) {
    try {
        const {
            writer_id,
            sample_url,
            price_per_page
        } = req.body;

        await insertWriter({
            writer_id,
            sample_url,
            price_per_page
        });

        res.status(201).json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}

export async function handleUpdateWriter(req, res, next) {
    try {
        const {
            writer_id,
            sample_url,
            price_per_page
        } = req.body;

        await updateWriter(writer_id, sample_url, price_per_page);

        res.status(201).json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}

export async function getAllWriters(req, res, next) {
    try {
        const writers = await fetchAllWriters();

        res.status(200).json({
            success: true,
            writers
        });

    } catch (err) {
        console.error(err);
        next(err);
    }
}

export async function handleGetAWriter(req, res, next) {
    const user_id = req.requesting_user.id;
    const writer_id = req.writer_id;

    try {
        const writer_details = await getWriter(user_id, writer_id);

        res.status(200).json({
            success: true,
            writer_details
        });
    }
    catch (err) {
        next(err);
    }
}

export async function handleWriterAvailability(req, res, next) {
    const writer_id = req.writer_id;
    const available = req.body.available;

    try {
        if (![true, false].includes(available))
            throw new InvalidData();

        res.status(201).json({
            success: await updateAvailability(writer_id, available)
        });
    }
    catch (err){
        next(err);
    }
}
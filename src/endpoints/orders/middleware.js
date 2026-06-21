import { 
    ForbiddenAccess, 
    InvalidData 
} from "../../error_classes/defined_errors.js";

export function validateCre_writerMemo(req, res, next) {
    const {
        writer_id,
        sample_url,
        price_per_page
    } = req.body;

    if (!writer_id || !sample_url || !price_per_page) {
        throw new InvalidData();
    }

    if (req.requesting_user.id !== Number(writer_id))
        throw new ForbiddenAccess();

    next();
}

export function verifyWriter(req, res, next){
    const writer_id = Number(req.query.writer_id);

    if (!writer_id)
        throw new InvalidData();

    req.writer_id = writer_id;

    next();
}
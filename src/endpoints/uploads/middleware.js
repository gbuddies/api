import { 
    ForbiddenAccess,
    InvalidData, 
    UnAuthorized 
} from "../../error_classes/defined_errors.js";

export function verifyUploadingUser(req, res, next){
    const user_id = Number(req.query.user_id);
    
    if (!user_id)
        throw new UnAuthorized();

    if (!Number.isInteger(user_id))
        throw new InvalidData();

    if (user_id !== req.requesting_user.id)
        throw new ForbiddenAccess();

    next();
}
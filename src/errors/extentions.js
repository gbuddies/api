import AppError from "./AppError.js";

export class MissingData extends AppError {

    constructor() {
        super(
            "Missing required data",
            400,
            "MISSING_DATA"
        );
    }
}

export class InvalidData extends AppError {

    constructor() {
        super(
            "Invalid data value",
            400,
            "INVALID_DATA"
        );
    }
}

export class InvalidEmail extends AppError {

    constructor() {
        super(
            "Wrong email format",
            400,
            "INVALID_EMAIL"
        );
    }
}

export class WeakPassword extends AppError {

    constructor() {
        super(
            "Password is too weak",
            400,
            "WEAK_PASSWORD"
        );
    }
}

export class MissingLowercase extends AppError {

    constructor() {
        super(
            "Password must contain a lowercase letter",
            400,
            "WEAK_PASSWORD_LOWERCASE"
        );
    }
}

export class MissingUppercase extends AppError {

    constructor() {
        super(
            "Password must contain an uppercase letter",
            400,
            "WEAK_PASSWORD_UPPERCASE"
        );
    }
}

export class MissingDigit extends AppError {

    constructor() {
        super(
            "Password must contain a digit",
            400,
            "WEAK_PASSWORD_DIGIT"
        );
    }
}

export class MissingSpecialChar extends AppError {

    constructor() {
        super(
            "Password must contain a special character",
            400,
            "WEAK_PASSWORD_SPECIAL"
        );
    }
}

export class ShortPassword extends AppError {

    constructor() {
        super(
            "Password is too short",
            400,
            "WEAK_PASSWORD_SHORT"
        );
    }
}

export class LowEntropyPassword extends AppError {

    constructor() {
        super(
            "Password entropy is too low",
            400,
            "WEAK_PASSWORD_ENTROPY"
        );
    }
}

export class RegistrationFailed extends AppError {

    constructor() {
        super(
            "User registration failed",
            500,
            "REGISTRATION_FAILED"
        );
    }
}

export class FrndReqTransactionFailed extends AppError {

    constructor() {
        super(
            "Friend request transaction failed",
            500,
            "FRND_REQ_TRANSACTION_ERROR"
        );
    }
}

export class DuplicateUser extends AppError {

    constructor() {
        super(
            "User with email already exists",
            409,
            "DUPLICATE_USER"
        );
    }
}

export class DBIntegrityError extends AppError {

    constructor() {
        super(
            "Generic DB error",
            500,
            "DB_INTEGRITY_ERROR"
        );
    }
}

export class InvalidUser extends AppError {

    constructor() {
        super(
            "Invalid email or password",
            401,
            "INVALID_USER"
        );
    }
}

export class NotFound extends AppError {

    constructor() {
        super(
            "Data not found or corrupted",
            404,
            "NOT_FOUND"
        );
    }
}

export class UnAuthorized extends AppError {

    constructor() {
        super(
            "User not authorized",
            401,
            "UNAUTHORIZED"
        );
    }
}

export class InvalidOTP extends AppError {

    constructor() {
        super(
            "OTP is expired or incorrect",
            400,
            "INVALID_OTP"
        );
    }
}

export class OTPNotFound extends AppError{

    constructor() {
        super(
            "OTP not found",
            404,
            "OTP_NOT_FOUND"
        )
    }
}

export class ForbiddenAccess extends AppError {

    constructor() {
        super(
            "Access is restricted",
            403,
            "FORBIDDEN"
        );
    }
}

export class RoomSizeExceeded extends AppError {

    constructor() {
        super(
            "Room is full",
            409,
            "ROOM_FULL"
        );
    }
}

export class InvalidJWT extends AppError {

    constructor() {
        super(
            "JWT expired or invalid",
            401,
            "INVALID_JWT"
        );
    }
}

export class DatabaseOrServerError extends AppError {

    constructor() {
        super(
            "Database or server error",
            500,
            "DATABASE_ERROR"
        );
    }
}
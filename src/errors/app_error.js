
export default class AppError extends Error{

    constructor(err_message, status_code, err_code){
        super(err_message);
        this.err_code = err_code;
        this.status_code = status_code;
        this.is_expected = true;
    }
}
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: "./files",
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const fileName = Date.now() + extension;
        cb(null, fileName);
    }
});

export const upload = multer({ storage });
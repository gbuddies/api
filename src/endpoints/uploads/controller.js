
export async function handleFIles(req, res, next) {
    const files = req.files;
    const files_list = [];

    for (const file of files) {
        files_list.push({
            "filename": file.originalname,
            "file_url": file.filename,
            "mime_type": file.mime_type
        });
    }

    res.status(201).json({
        success: true,
        files_list
    });
}
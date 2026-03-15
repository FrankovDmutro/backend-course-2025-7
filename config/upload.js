const path = require('path');
const multer = require('multer');

function createUpload(cacheDirectory) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, cacheDirectory),
        filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
    });

    return multer({ storage });
}

module.exports = createUpload;

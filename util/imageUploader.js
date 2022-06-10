const cloudinary = require('../library/cloudinary');

const imageUploader = async (req, res, next) => {
    if (req.files?.photo) {
        const body = req.body;
        const file = req.files.photo;
        //@ts-ignore
        const upload = await cloudinary.uploader.upload(file.tempFilePath);
        body.photo = upload.public_id;
    }

    if (req.files?.thumbnail) {
        const body = req.body;
        const file = req.files.thumbnail;
        //@ts-ignore
        const upload = await cloudinary.uploader.upload(file.tempFilePath);
        body.thumbnail = upload.public_id;
    }

    if (req.files?.banner) {
        const body = req.body;
        const file = req.files.banner;
        //@ts-ignore
        const upload = await cloudinary.uploader.upload(file.tempFilePath);
        body.banner = upload.public_id;
    }

    next();
};

module.exports = imageUploader;

// CREATE OUR OWN CUSTOM MIDDLEWARE AND WRAP MULTER INTO IT
const multer = require('multer');

// const uuid = require('uuid/v1');
const { v1: uuidv1 } = require('uuid');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
};

const fileUpload = multer({ // Executing multer as a function to which we can pass a configuration object and save the result into fileUpload as a middleware
    limits: 500000, // Upload limit of 500KB
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, 'uploads/images');
        },
        filename: (req, file, callback) => {
            const ext = MIME_TYPE_MAP[file.mimetype]; // Dynamically accessing the mimetype object and extracting the right extension
            callback(null, uuidv1() + '.' + ext); // Generates a random file name with the right extension
        }
    }),
    fileFilter: (req, file, callback) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype]; // The !! is used to convert undefined to either true or false
        let error = isValid ? null : new Error('Invalid mime type!');
        callback(error, isValid); // Forward the error and isValid which is either true or false to the callback function
    }
});
module.exports = fileUpload;
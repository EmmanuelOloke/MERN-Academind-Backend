const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator'); //This is used to validate if the email provided is unique and check if it exists already

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // The unique field simply speeds up code execution on the email property. Makes sure it is queried as fast as possible
    password: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true },
    places: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
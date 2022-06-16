const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user'); // Importing the user model from user.js

const getUsers = async(req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password'); // With the .find() method here, we search the document stored in DB and find the users. By passing an empty object and the string '-password', we make sure the password field is not return with other user info for security reasons.
    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again later', 500);
        return next(error);
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) }); // We're using the map() method here because .find() returns an array. Then turning each user to a default JS object so we can set getters: true to remove the default underscore in the returned id.
}

const signup = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid field entry, please check your entries', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email }) // The findOne() here checks if the document matches the criteria passed into the method, hence checking if the email exists already
    } catch (err) { // If the try block fails, we simply catch the error with a staus code of 500
        const error = new HttpError('Signup failed, please try again', 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError('User exists already, please log in instead', 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image: 'https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg',
        password,
        places: [] // New places will be added to the array by the user. Hence why we first initialize places to be an empty array
    });

    try {
        await createdUser.save(); // .save() is a method in mongoose that handles all the MongoDB logic you need to store a new collection in your DB. Returns a promise, so it's an asynchronous task
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again', 500);
        return next(error); // This stops code execution when/if we encounter an error
    }

    res.status(201).json({ users: createdUser.toObject({ getters: true }) }); // Converting to normal JS object and removing the default underscore added to id by mongoDB
}

const login = async(req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email }) // The findOne() here checks if the document matches the criteria passed into the method, hence checking if the email exists already
    } catch (err) { // If the try block fails, we simply catch the error
        const error = new HttpError('Login failed, please try again', 500);
        return next(error);
    }

    if (!existingUser || existingUser.password !== password) {
        const error = new HttpError('Invalid credentialsl, could not log you in', 401);
        return next(error);
    }

    res.json({ message: 'Login successful' });
}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
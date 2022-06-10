const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user'); // Importing the user model from user.js

const DUMMY_USERS = [{
    id: 'u1',
    name: 'Emmanuel Oloke',
    email: 'test@test.com',
    password: 'tester'
}];

const getUsers = (req, res, next) => {
    res.status(200).json({ users: DUMMY_USERS });
}

const signup = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid field entry, please check your entries', 422));
    }

    const { name, email, password, places } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email }) // The findOne() here checks if the document matches the criteria passed into the method, hence checking if the email exists already
    } catch (err) { // If the try block fails, we simply catch the error
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
        places
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
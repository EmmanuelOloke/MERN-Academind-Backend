const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    let hashedPassword;
    try { // hash() returns a promise and since we're already in an async function, it makes sense to just use an await on it
        hashedPassword = await bcrypt.hash(password, 12); // hash() takes two parameters, which are the password string to be hashed and a salting round number which determines how difficult the password will be to reverse-engineer
    } catch (err) {
        const error = new HttpError('Could not create user, please try again', 500);
        return next(error);
    }
    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: [] // New places will be added to the array by the user. Hence why we first initialize places to be an empty array
    });

    try {
        await createdUser.save(); // .save() is a method in mongoose that handles all the MongoDB logic you need to store a new collection in your DB. Returns a promise, so it's an asynchronous task
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again', 500);
        return next(error); // This stops code execution when/if we encounter an error
    }
    // At this point we know we've already stored a user in the database, so we know this is a valid user, so we can now generate a token for that user
    try {
        let token;
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, 'supersecret_dont_share', { expiresIn: '1h' }); // The sign method returns a string in the end, which will be the token. It takes two argument. The first arg is the payload of the token (the data you wanna encode into the token) which can be a string, an object or a buffer, here we passed an object containing the userId and email. The second argument is the private key string. The third argument is optional, check out the docs
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again', 500);
        return next(error);
    }
    // Eventually here we return the token and some user details, instead of the entire user object, because not all user data is required on the frontend, but that depends on the app being built
    res.status(201).json({ userId: createdUser.Id, email: createdUser.email, token: token }); // Sending back the id of the user that was created, the email and the token that was generated.
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

    if (!existingUser) {
        const error = new HttpError('Invalid credentials, could not log you in', 401);
        return next(error);
    }

    isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password); // The compare method provided by bcrypt compare the plain text password entered to the hashed password already saved in the db. It returns a promise which in the end yields a boolean.
    } catch (err) {
        const error = new HttpError('Could not log you in, please check your credentials and try again', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid credentials, could not log you in', 401);
        return next(error);
    }

    // We also generate the token on login. 
    try {
        let token;
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, 'supersecret_dont_share', { expiresIn: '1h' }); // We make sure to use the same private key as the one in signup route so we don't generate different tokens, so we can verify them on the backend
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again', 500);
        return next(error);
    }

    res.json({ userId: existingUser.id, email: existingUser.email, token: token }); // Sending back the userId, email and the token generated
}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
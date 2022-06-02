const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

const DUMMY_USERS = [{
    id: 'u1',
    name: 'Emmanuel Oloke',
    email: 'test@test.com',
    password: 'tester'
}];

const getUsers = (req, res, next) => {
    res.status(200).json({ users: DUMMY_USERS });
}

const signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid field entry, please check your entries', 422);
    }

    const { name, email, password } = req.body;

    const hasUser = DUMMY_USERS.find(u => u.email === email);

    if (hasUser) {
        throw new HttpError('Could not create user, email already exists in our records', 422); // Error code 422 means invalid user input
    }

    const createdUser = {
        id: uuidv4(),
        name,
        email,
        password
    }

    DUMMY_USERS.push(createdUser);

    res.status(201).json({ users: createdUser });
}

const login = (req, res, next) => {
    const { email, password } = req.body;

    const identifiedUser = DUMMY_USERS.find(u => u.email === email);

    if (!identifiedUser || identifiedUser.password !== password) {
        throw new HttpError('Could not identify this user, credentials do not match our records', 401); // Error code 401 means invalid authentication credentials.
    }

    res.json({ message: 'Login successful' });
}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
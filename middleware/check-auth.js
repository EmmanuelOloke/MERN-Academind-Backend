const jwt = require('jsonwebtoken'); // Import jwt here so we can use it to verify the token

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => { // Middleware function to check whether we have a token and if the token is valid
    try {
        const token = req.headers.authorization.split(' ')[1]; // Encoding the token in the headers of the incoming request (Best Practice). The authorization object returns something of this sort (Authorization: 'Bearer TOKEN') and we use the split method split it after the Bearer keyword and return the second element which will be the token
        if (!token) {
            throw new Error('Authentication failed'); // If we don't have a token, we basically throw an error.
        }
        const decodedToken = jwt.verify(token, 'supersecret_dont_share'); // The verify object returns a string or an object, which is the payload that was encoded into the token. Containing the userId, email and token as specified in users-controller.js file
        reg.userData = { userId: decodedToken.userId }; // Here we extract the userId from the verified token and add it to the user data request
        next();
    } catch (err) {
        const error = new HttpError('Authentication failed', 401);
        return next(error);
    }
};
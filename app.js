require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes'); // Importing the configured route from places-routes.js ***** And this now is conviniently a middleware and use the middleware functions like app.use on it
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json()); // This will parse any incoming request on the body, and extract any json data in there and convert it to regular JS data structure like objects and arrays and then call next automatically so that we reach the next middlewaare in line which are our own custom routes and also add the json data there.

app.use('/api/places', placesRoutes); // EpressJS will make sure to forward only Routes with paths beginning with /api/places to our places-routes.js configured file
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next) => { // ExpressJS defualt error handler. Special middleware function with 4 parameters instead of 3 (error). ExpressJS treats middleware functions with 4 parameters as special/error handling functions. Only executed on requests that have an error attached to it.
    if (res.headerSent) { // We check if a response has already been sent
        return next(error);
    }
    res.status(error.code || 500); // We check if the code property on the error object is set. If it's not we fall back to the server error code 500.
    res.json({ message: error.message || 'An unknown error occurred!' }); // Every error we send back from our API should have a message property, which the attached client can then use to show an error message to their user.
});

mongoose.connect(process.env.DB_URI).then(() => {
    app.listen(8000);
}).catch(err => {
    console.log(err);
}); // .connect() returns a promise because connecting to the server is an asynchronous task
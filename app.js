const express = require('express');
const bodyParser = require('body-parser');

const placesRoutes = require('./routes/places-routes'); // Importing the configured route from places-routes.js ***** And this now is conviniently a middleware and use the middleware functions like app.use on it
const usersRoutes = require('./routes/users-routes');

const app = express();

app.use('/api/places', placesRoutes); // EpressJS will make sure to forward only Routes with paths beginning with /api/places to our places-routes.js configured file

app.use('/api/users', usersRoutes);


app.listen(8000);
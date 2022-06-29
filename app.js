const fs = require('fs');
const path = require('path'); // path module built into nodejs to serve files

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes'); // Importing the configured route from places-routes.js ***** And this now is conviniently a middleware and use the middleware functions like app.use on it
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json()); // This will parse any incoming request on the body, and extract any json data in there and convert it to regular JS data structure like objects and arrays and then call next automatically so that we reach the next middlewaare in line which are our own custom routes and also add the json data there.

app.use('/uploads/images', express.static(path.join('uploads', 'images'))); // Requests to the specified url will be handled by the express.static() middleware, built into express. It returns the requested file. It expects a path pointing to the folder from which you want to serve the files

app.use((req, res, next) => { // Middleware to handle Cross-Origin Resource Sharing (CORS) error
    res.setHeader('Access-Control-Allow-Origin', '*'); // This allows us to control which domain should have access to our requests, and setting it to '*' means we allow every domain to have accesss, thereby eliminating the CORS error.
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Specifying which headers the requests sent by the browser may have
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE'); // Controls which HTTP methods may be used on the Frontend
    next();
});

app.use('/api/places', placesRoutes); // EpressJS will make sure to forward only Routes with paths beginning with /api/places to our places-routes.js configured file
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next) => { // ExpressJS defualt error handler. Special middleware function with 4 parameters instead of 3 (error). ExpressJS treats middleware functions with 4 parameters as special/error handling functions. Only executed on requests that have an error attached to it.
    if (req.file) { // Multer adds a file property to the req object, so we can check if we do have a file attached to the request, and roll back the saving process/delete the file if we don't
        fs.unlink(req.file.path, (err) => { // We use the file system (fs) object to delete(unlink) the file. path is a property on the file object added by multer and it points to the file to be deleted. The callbac function will be triggered when the deletion is done
            console.log(err);
        });
    }

    if (res.headerSent) { // We check if a response has already been sent
        return next(error);
    }
    res.status(error.code || 500); // We check if the code property on the error object is set. If it's not we fall back to the server error code 500.
    res.json({ message: error.message || 'An unknown error occurred!' }); // Every error we send back from our API should have a message property, which the attached client can then use to show an error message to their user.
});

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mern-academind-mongodb.4ruhkba.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`).then(() => {
    app.listen(process.env.PORT || 8000);
}).catch(err => {
    console.log(err);
}); // .connect() returns a promise because connecting to the server is an asynchronous task
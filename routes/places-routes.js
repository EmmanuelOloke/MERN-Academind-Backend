const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controllers');
const fileUpload = require('../middleware/file-upload'); // This is not the main middleware, but it's an object with a bunch of middlewares where we can get the right middleware by calling the .single() method later in router.post method
const checkAuth = require('../middleware/check-auth');

const router = express.Router(); // Gives us a special object on which we can register middlewares which are filtered by http methods and paths. We can then export out our configured router which we can later import in our app.js file and register this entire configured router as one single middleware in app.js

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId);

router.use(checkAuth); // Middleware to check the incoming request for a valid token and if the token is invalid it will send back a response and block the request from continuing it's journey to the other routes

router.post('/', fileUpload.single('image'), [check('title').not().isEmpty(), check('description').isLength({ min: 5 }), check('address').not().isEmpty()], placesControllers.createPlace);

router.patch('/:pid', [check('title').not().isEmpty(), check('description').isLength({ min: 5 })], placesControllers.updatePlace);

router.delete('/:pid', placesControllers.deletePlace);

module.exports = router; // How to export in Nodejs i.e What is being exported in the file is the router constant
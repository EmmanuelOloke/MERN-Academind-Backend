const express = require('express');

const placesControllers = require('../controllers/places-controller');

const router = express.Router(); // Gives us a special object on which we can register middlewares which are filtered by http methods and paths. We can then export out our configured router which we can later import in our app.js file and register this entire configured router as one single middleware in app.js

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlaceByUserId);

module.exports = router; // How to export in Nodejs i.e What is being exported in the file is the router constant
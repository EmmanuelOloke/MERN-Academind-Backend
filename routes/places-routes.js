const express = require('express');

const router = express.Router(); // Gives us a special object on which we can register middlewares which are filtered by http methods and paths. We can then export out our configured router which we can later import it in our app.js file and register this entire configured router as one single middleware in app.js

const DUMMY_PLACES = [{
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous skyscrappers in the world!',
    location: {
        lat: 40.7484474,
        lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
}];

router.get('/:pid', (req, res, next) => {
    const placeId = req.params.pid; // We use the req.params to get the concrete value that was entered for the concrete request that reaches this function. The params property olds an object where the dynamic segment (:pid) exists as keys and the value will be the concrete value that the user who sent the request entered. 
    const place = DUMMY_PLACES.find(p => {
        return p.id === placeId;
    }); // Default JS Array method that helps us find a specific elements in an array.
    res.json({ place }); // Sends back a response with some json data => {place} => {place: place}, if the name of a property is the same and the name of it's value you can shorten it like so in JS
});

module.exports = router; // How to export in Nodejs i.e What is being exported in the file is the router constant
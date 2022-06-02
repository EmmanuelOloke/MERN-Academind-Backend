const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

let DUMMY_PLACES = [{
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

const getPlaceById = (req, res, next) => {
    const placeId = req.params.pid; // We use the req.params to get the concrete value that was entered for the concrete request that reaches this function. The params property olds an object where the dynamic segment (:pid) exists as keys and the value will be the concrete value that the user who sent the request entered. 

    const place = DUMMY_PLACES.find(p => {
        return p.id === placeId;
    }); // Default JS Array method that helps us find a specific elements in an array.

    if (!place) {
        throw new HttpError('Could not find a place for the provided id.', 404);
    }

    res.json({ place }); // Sends back a response with some json data => {place} => {place: place}, if the name of a property is the same and the name of it's value you can shorten it like so in JS
};

const getPlacesByUserId = (req, res, next) => {
    const userId = req.params.uid;

    const places = DUMMY_PLACES.filter(p => {
        return p.creator === userId;
    });

    if (!places || places.length === 0) {
        return next(new HttpError('Could not find places for the provided user id.', 404));
    }

    res.json({ places });
};

const createPlace = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid inputs passed, please check your entries', 422);
    }

    const { title, description, coordinates, address, creator } = req.body; // Getting the parsed body from body-Parser using req.body

    const createdPlace = {
        id: uuidv4(),
        title,
        description,
        location: coordinates,
        address,
        creator
    };

    DUMMY_PLACES.push(createdPlace);

    res.status(201).json({ place: createdPlace });
}

const updatePlace = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid inputs, please check your entries', 422);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid; // Getting the placeId from the route parameter (/:pid)

    const updatedPlace = {...DUMMY_PLACES.find(p => p.id === placeId) };
    const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
    updatedPlace.title = title;
    updatedPlace.description = description;

    DUMMY_PLACES[placeIndex] = updatedPlace;

    res.status(200).json({ place: updatedPlace });
}

const deletePlace = (req, res, next) => {
    const placeId = req.params.pid;
    DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

    res.status(200).json({ message: 'Place Deleted' });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
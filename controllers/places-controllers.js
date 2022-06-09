const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');

const Place = require('../models/place');

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

const getPlaceById = async(req, res, next) => { // Because we're getting from the db, the task is asynchronous and can take some time, so we use asynch/await
    const placeId = req.params.pid; // We use the req.params to get the concrete value that was entered for the concrete request that reaches this function. The params property olds an object where the dynamic segment (:pid) exists as keys and the value will be the concrete value that the user who sent the request entered. 

    let place;
    try {
        place = await Place.findById(placeId); // Using the Place model exported from place.js and attaching the mongoose method .findById() which finds a specific id in our request. It doesn't return a promise but .then(), .carch(), async and await will still be available, [mongoose specific]. If we need a real promise we can use .exec().
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find place.', 500); // This error is displayed if we can find the place by id but for some reason the get request fails
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find a place for the provided id.', 404); // This error is displayed if the request executes fine but we cannot find a place entirely.
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) }); // Converts the Mongoose place object we get back to a proper JS object with the .toObject() method and removes the default id underscore added by mongoDB by setting getters: true
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

const createPlace = async(req, res, next) => { // Converted to Async function so that we can work with await.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your entries', 422)); // Used next() instead of throw, because throw will not work currectly in a node async function.
    }

    const { title, description, address, creator } = req.body; // Getting the parsed body from body-Parser using req.body

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error); // Foward the error, if we do have an error and return it so that no other code runs.
    }

    const createdPlace = new Place({ // Here is the logic that creates a place based on the defined Schema in place.js and saves it in the DB
        title,
        description,
        address,
        location: coordinates,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu.jpg/640px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu.jpg',
        creator
    });

    try {
        await createdPlace.save(); // .save()is a method in mongoose that handles all the MongoDB logic you need to store a new collection in your DB. Returns a promise, so it's an asynchronous task
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);

        return next(error); // This stops code execution when/if we encounter an error
    }

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

    if (!DUMMY_PLACES.find(p => p.id === placeId)) {
        throw new HttpError('Could not find a place for that id', 404);
    }

    DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

    res.status(200).json({ message: 'Place Deleted' });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
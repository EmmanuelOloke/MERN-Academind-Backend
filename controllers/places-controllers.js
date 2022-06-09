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
        place = await Place.findById(placeId); // Using the Place model exported from place.js and attaching the mongoose method .findById() which finds a specific id in our request. It doesn't return a promise but .then(), .catch(), async and await will still be available, [mongoose specific]. If we need a real promise we can use .exec().
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

const getPlacesByUserId = async(req, res, next) => {
    const userId = req.params.uid;

    let places;
    try {
        places = await Place.find({ creator: userId }); // .find() is a method available in both mongoDB and mongoose and it returns a cursor. In mongoose it returns an array, which we can then iterate over to get the specific documents where the creator has the user id that has been specified in our get request.
    } catch (err) {
        const error = new HttpError('Fetching places failed, please try again', 500);
        return next(error);
    }

    if (!places || places.length === 0) {
        const error = new HttpError('Could not find places for the provided user id.', 404);
        return next(error);
    }

    res.json({ places: places.map(place => place.toObject({ getters: true })) }); // Using .map() here because the place we get back is an array.
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
        await createdPlace.save(); // .save() is a method in mongoose that handles all the MongoDB logic you need to store a new collection in your DB. Returns a promise, so it's an asynchronous task
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);

        return next(error); // This stops code execution when/if we encounter an error
    }

    res.status(201).json({ place: createdPlace });
}

const updatePlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid inputs, please check your entries', 422);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid; // Getting the placeId from the route parameter (/:pid)

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update the place.', 500);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try { // Storing the updated place in the db
        await place.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update the place.', 500);
        return next(error);
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });
}

const deletePlace = async(req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId); // To delete a place, first we need to find it and that's what's been done here.
    } catch (err) {
        const error = new HttpError('Something went wrong, cannot delete place.', 500);
        return next(error);
    }

    try {
        await place.remove(); // Here we actually remove the place from the Database. Async task, hence why we used await.
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete the place.', 500);
        return next(error);
    }
    res.status(200).json({ message: 'Place Deleted' });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
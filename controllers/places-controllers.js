const { v4: uuidv4 } = require('uuid');

const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');

const Place = require('../models/place');
const User = require('../models/user'); // We import User here as we will interact with it when a place is added.

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
        const error = new HttpError('Could not find a place for the provided id.', 404); // This error is displayed if the request executes fine but we cannot find a place entirely i.e specifically for the id provided..
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) }); // Converts the Mongoose place object we get back to a proper JS object with the .toObject() method and removes the default id underscore added by mongoDB by setting getters: true
};

const getPlacesByUserId = async(req, res, next) => {
    const userId = req.params.uid;

    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places'); // Here we get a specific user with the userId, then with the .populate() method, we now get access to the places that specific user has, by passing in the 'places' property.
    } catch (err) {
        const error = new HttpError('Fetching places failed, please try again', 500);
        return next(error);
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        const error = new HttpError('Could not find places for the provided user id.', 404);
        return next(error);
    }

    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) }); // Using .map() here because the place we get back is an array.
};

const createPlace = async(req, res, next) => { // Converted to Async function so that we can work with await.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your entries', 422)); // Used next() instead of throw, because throw will not work currectly in a node async function.
    }

    const { title, description, address } = req.body; // Getting the parsed body from body-Parser using req.body

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
        image: req.file.path,
        creator: req.userData.userId // This makes sure we get the userId from the one extracted from the token and not just the request where invalid userId can be passed
    });

    // Instead of just saving directly, we first check if the userId provided exists already.
    let user;
    try {
        user = await User.findById(req.userData.userId); // Access the creator property of the user and check if the id of our logged in user is already stored in here i.e already existing
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for the provided id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession(); // Transaction allows us to perform multiple operations independent of eachother, to work with transactions we first have to start a session. If creating a place or finding a user fails, then we don't save the document to the database
        sess.startTransaction(); // Here is where the start the transaction.
        await createdPlace.save({ session: sess }); //Create a place. Save the createdPlace in the db using the currently running session. This also automatically create a unique id for our place. Ssving to the db is an asynchronous task, hence why we user await
        user.places.push(createdPlace); // Add place id. To make sure the placeId is also added to our user. push() here is not the arry method, but a mongoose method used to establish the connection between the two models we're referring to. Behind the scenes, mongoDB wraps the createdPlace id and adds it to the place field of the user. Only adds the place's id.
        await user.save({ session: sess }); // Saving the updated user (that is the user that places have been added to) and making sure it is part of our current session.
        await sess.commitTransaction(); // If all the above passes, then we save in the db by commiting the transaction. If any error occur, the process/transaction will be rolled back by mongoDB.
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);

        return next(error); // This stops code execution when/if we encounter an error
    }

    res.status(201).json({ place: createdPlace });
}

const updatePlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs, please check your entries', 422));
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

    if (place.creator.toString() !== req.userData.userId) { // Making sure only the user that created a place can edit that particular place. We have to use .toString on creator because it is originally an object of type mongoose
        const error = new HttpError('You are not allowed to edit this place.', 401); // 401 is for unauthorization error
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
        place = await Place.findById(placeId).populate('creator'); // To delete a place, first we need to find it and that's what's been done here. .populate() allows us to refer to a document stored in another collection and to work with the data in that document. We do this because when we delete a place, we also want to delete the id of that place in the corresponding user document. This populate() method holds the full user objects and works because we have a ref property in the user.js and place.js Schemas.
    } catch (err) {
        const error = new HttpError('Something went wrong, cannot delete place.', 500);
        return next(error);
    }

    if (!place) { // Check if the place actually exists and if it doesn't throw an error
        const error = new HttpError('Could not find places for this id', 404);
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) { // Since the populate() method gives us access to the full creator object here, therefore we can use place.creator.id to get the id of the particular user and compare it to the userData id gotten from the req body
        const error = new HttpError('You are not allowed to delete this place.', 401);
        return next(error);
    }
    const imagePath = place.image; // Getting access to the image path

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess }); // We're removing the place from the DB, the seesion peoperty is added to make sure that we refer to the current session we just created. Removing is an async task hence why we have await.
        place.creator.places.pull(place); // Accessing the place stored in the creator, that is the placeId. .pull() will automatically remove an id.
        await place.creator.save({ session: sess }); // This saves our newly created user. "creator" gives us the full user opbject linkde to that place
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete the place.', 500);
        return next(error);
    }

    fs.unlink(imagePath, (err) => {
        console.log(err);
    });

    res.status(200).json({ message: 'Place Deleted' });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
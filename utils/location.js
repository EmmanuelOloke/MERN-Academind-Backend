const axios = require('axios');

const HttpError = require('../models/http-error');

const API_KEY = 'AIzaSyBwEupH-kfEo8Xyw8_dSoFGI3zYhho99Aw';

const getCoordsForAddress = async(address) => {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);

    const data = response.data; // Axios gives us a data field on the response object that holds our data

    if (!data || data.status === 'ZERO_RESULTS') { // This handles for when a user enters a valid address as per our validation logic but the address can't be found on googlemaps api
        const error = new HttpError('Could not find location for the specified address', 422);
        throw error;
    }

    const coordinates = data.results[0].geometry.location;
    return coordinates;
}

module.exports = getCoordsForAddress;
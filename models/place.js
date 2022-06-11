// CREATING A PLACE MODEL ----- A SCHEMA FOR PLACES TO BE STORED IN THE DB
const mongoose = require('mongoose');

const Schema = mongoose.Schema; // Access the Schema method of mongoose package to create a Schema.

const placeSchema = new Schema({ // The actual Schema to create a single place. Instantiate it to create a new JS object which contains the logic for the blueprint of the documents to be saved in the DB.
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' } // Making the creator id into a real mongoDB id using mongoose. ref field allows us to establish a connection between this placeScema and other userSchema.
});

module.exports = mongoose.model('Place', placeSchema); // After we've created the Schema, we need to create the model as well. Special method in mongoose which returns a constructor function. First argument is the name of the model in this case "Place" and the second argument is the schema we want to refer to which in this case is "placeSchema"
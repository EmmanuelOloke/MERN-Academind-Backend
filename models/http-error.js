class HttpError extends Error { // Class HttpError extends the default Error class in JS
    constructor(message, errorCode) {
        super(message); // This calls the constructor of the main class i.e Error and forwards message to it. And also add a "message" property to the instances we create.
        this.code = errorCode; // Adds a "code" property to instances based on this class.
    }
}

module.exports = HttpError;
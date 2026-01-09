const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');

const DBURI = process.env.DB_URI

mongoose
    .connect(DBURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: process.env.NODE_ENV === 'development', // enable in dev
        // useFindAndModify: false,
        // useCreateIndex: true,
        // poolSize: 10,
    })
    .then(() => console.log("Connection successful!"))
    .catch((e) => {
        console.log(e)
        throw new Error("Error Occurred!");
    });

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
    });
});

mongoose.Promise = require("bluebird");


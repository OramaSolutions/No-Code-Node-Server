const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');

// const DBURI = "mongodb://127.0.0.1:27017/orama"
const DBURI = "mongodb+srv://development:4aVXy9SwbeXg9eWy@no-code.fyayrmb.mongodb.net/?retryWrites=true&w=majority&appName=no-code"
// 4aVXy9SwbeXg9eWy
// mobulusdb-  mongodb://remoteUser:userRemote%232k24%2412345@43.204.39.194:27017/orama?authSource=admin&directConnection=true
// mongodb+srv://development:4aVXy9SwbeXg9eWy@no-code.fyayrmb.mongodb.net/?retryWrites=true&w=majority&appName=no-code
mongoose
    .connect(DBURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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


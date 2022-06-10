const cookieParser = require('cookie-parser');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const AppError = require('./util/appError');
const globalErrorHandler = require('./middleware/globalErrorHandler');
const helmet = require('helmet');
const ExpressMongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const imageUploader = require('./util/imageUploader');
const bodyParser = require('body-parser');
const eventRouter = require('./resource/events/events.router');
const userRouter = require('./resource/user/user.router');

const app = express();

// 1. Global Middleware

// Set security HTTP headers
app.use(helmet());
app.use(cors());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from the same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(ExpressMongoSanitize());

// data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: ['price', 'rate', 'location', 'distance', 'duration'],
    })
);

// middleware to log the request
// app.use((req, res, next) => {
//     // console.log(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
//     console.log('req', req.body);
//     next();
// });

// file upload middleware
app.use(fileUpload({ useTempFiles: true }));

// upload image to cloudinary

app.use(imageUploader);

// connect mongoose to the database

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(
            `database connected successfully at ${new Date().toLocaleString()}`
        );
    })
    .catch((err) => {
        console.log(err);
    });

// use routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/events', eventRouter);

app.all('*', (req, res, next) =>
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
);

// global error handler
app.use(globalErrorHandler);

// export the server middleware
module.exports = app;

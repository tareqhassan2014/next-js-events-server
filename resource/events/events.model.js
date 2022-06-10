// create events schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const EventSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
            maxlength: [50, 'Title can not be more than 50 characters'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            maxlength: [500, 'Description can not be more than 500 characters'],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, 'Please add a date'],
            default: Date.now,
        },
        /*   location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: [Number],
            address: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        }, */
        location: {
            type: String,
            required: [true, 'Please add a location'],
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
            min: [0, 'Price must be greater than 0'],
            max: [100000, 'Price can not be more than 100000'],
        },
        /*   host: {
            type: ObjectId,
            ref: 'User',
            required: [true, 'Please add a host'],
        }, */
        attendees: [
            {
                type: ObjectId,
                ref: 'User',
            },
        ],
        image: {
            type: String,
            default: 'no-image.jpg',
        },
    },
    {
        timestamps: true,
    }
);

// create a virtual for the event's url
EventSchema.virtual('url').get(function () {
    return `/events/${this._id}`;
});

// geo spatial index
// EventSchema.index({ location: '2dsphere' });

// static method to get upcoming events
EventSchema.statics.getUpcomingEvents = function () {
    return this.find({
        date: {
            $gte: new Date(),
        },
    })
        .populate('host', 'name email')
        .sort({ date: 1 });
};

// static method to get past events
EventSchema.statics.getPastEvents = function () {
    return this.find({
        date: {
            $lt: new Date(),
        },
    })
        .populate('host', 'name email')
        .sort({ date: -1 });
};

const Event = mongoose.model('Event', EventSchema);
module.exports = Event;

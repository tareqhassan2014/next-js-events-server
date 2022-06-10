const {
    createOne,
    getOne,
    getAll,
    updateOne,
    deleteOne,
} = require('../../util/factory');
const Event = require('./events.model');

exports.createEvents = createOne(Event);
exports.getEvent = getOne(Event);
exports.getAllEvents = getAll(Event);
exports.updateEvents = updateOne(Event);
exports.deleteEvents = deleteOne(Event);

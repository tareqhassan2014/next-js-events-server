const {
    getAllEvents,
    createEvents,
    getEvent,
    updateEvents,
    deleteEvents,
} = require('./event.controller');

const eventRouter = require('express').Router();

eventRouter.route('/').get(getAllEvents).post(createEvents);
eventRouter
    .route('/:id')
    .get(getEvent)
    .patch(updateEvents)
    .delete(deleteEvents);

module.exports = eventRouter;

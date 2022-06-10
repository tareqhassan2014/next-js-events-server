const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const APIFeatures = require('./apiFeature');

//delete one document from a collection
const deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const data = await Model.findByIdAndDelete(req.params.id);

        if (!data) {
            return next(new AppError('No document found with that ID', 404));
        }

        return res.status(204).json({
            status: 'success',
            data: null,
        });
    });

//get all documents from a collection
const getAll = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour (hack)
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const features = new APIFeatures(
            Model.find(filter),
            req.query,
            popOptions
        )
            .filter()
            .sort()
            .limitFields()
            .paginate()
            .populate();

        // const doc = await features.query.explain();
        const data = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: data.length,
            data: {
                data,
            },
        });
    });

//get one document from a collection
const getOne = (Model, popOption) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOption) query = query.populate(popOption);
        const data = await query;

        if (!data) {
            return next(new AppError(`No document found with that ID`, 404));
        }
        res.status(200).json({
            status: 200,
            data: {
                data,
            },
            message: 'Successfully retrieved one document',
        });
    });

//create a document in a collection
const createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const data = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data,
            },
        });
    });

//update a document in a collection
const updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!data) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data,
            },
        });
    });

module.exports = { deleteOne, getAll, getOne, createOne, updateOne };

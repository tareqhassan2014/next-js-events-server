const { sendTokenResponse } = require('./auth.controller');
const userModel = require('./user.model');
const catchAsync = require('../../middleware/catchAsync');
const { getOne } = require('../../util/factory');
const AppError = require('../../util/appError');

// filterObject
const filterObject = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// update profile
const updateMe = catchAsync(async (req, res, next) => {
    const { name, photo } = req.body;

    // 1) create appError if user posts password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword',
                400
            )
        );
    }

    const user = await userModel.findByIdAndUpdate(
        req.user.id,
        {
            name,
            photo,
        },
        { new: true, runValidators: true }
    );

    sendTokenResponse(user, 200, res);
});

// delete Me
const deleteMe = catchAsync(async (req, res, next) => {
    await userModel.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// get all users
const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await userModel.find({ active: true });

    res.status(200).json({
        status: 'success',
        results: users.length,
        users,
    });
});

// get me
const getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// get user
const getUser = catchAsync(async (req, res, next) => {
    const user = await userModel
        .findById(req.params.id)
        .populate({ path: 'hostel' });

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        user,
    });
});

module.exports = {
    updateMe,
    deleteMe,
    getAllUsers,
    getMe,
    getUser,
};

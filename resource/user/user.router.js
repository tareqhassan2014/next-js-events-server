const {
    signup,
    login,
    protect,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout,
} = require('./auth.controller');
const {
    updateMe,
    deleteMe,
    getAllUsers,
    getMe,
    getUser,
} = require('./user.controller');

const userRouter = require('express').Router();

userRouter.route('/signup').post(signup);
userRouter.route('/login').post(login);
userRouter.route('/logout').get(logout);
userRouter.route('/forgotPassword').post(forgotPassword);
userRouter.route('/resetPassword/:token').patch(resetPassword);

// Protected all routes after this middleware
userRouter.use(protect);

userRouter.route('/').get(getAllUsers);
userRouter.route('/me').get(getMe, getUser);
userRouter.route('/updateMe').patch(updateMe);
userRouter.route('/deleteMe').delete(deleteMe);
userRouter.route('/updateMyPassword').patch(updatePassword);

module.exports = userRouter;

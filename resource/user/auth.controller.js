// create a auth controller
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../../middleware/catchAsync');
const User = require('./user.model');
const AppError = require('../../util/appError');
const sendEmail = require('../../util/email');

//signToken
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// create and send token
const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    // remove password from output though we already remove it from schema
    user.password = undefined;
    user.active = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user,
    });
};

const signup = catchAsync(async (req, res, next) => {
    const { email, password, passwordConfirm, photo, name } = req.body;
    const user = await User.create({
        email,
        password,
        passwordConfirm,
        photo,
        name,
    });

    sendTokenResponse(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const query = User.findOne({ email })
        .select('+password')
        .populate({ path: 'hostel' })
        .populate({ path: 'store' });

    const user = await query;

    // check password is correct
    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    sendTokenResponse(user, 200, res);
});

// protect
const protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please log in to get access',
                401
            )
        );
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const query = User.findById(decoded.id)
        .populate({ path: 'hostel' })
        .populate({ path: 'store' });

    const currentUser = await query;

    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token does not exist', 401)
        );
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again to get access',
                401
            )
        );
    }

    req.user = currentUser;

    next();
});

// restrict middleware
const restrict = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

// forgat password
const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(
            new AppError('There is no user with this email address', 404)
        );
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error sending the email. Try again later',
                500
            )
        );
    }
});

// reset password
const resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// update password
const updatePassword = catchAsync(async (req, res, next) => {
    const { password, passwordConfirm, passwordCurrent } = req.body;

    if (!password || !passwordConfirm) {
        return next(
            new AppError('Please provide a password and passwordConfirm', 400)
        );
    }

    if (password !== passwordConfirm) {
        return next(new AppError('Passwords do not match', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new AppError('User does not exist', 404));
    }

    const isMatch = await user.comparePassword(passwordCurrent, user.password);

    if (!isMatch) {
        return next(new AppError('Password is incorrect', 400));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// logout
const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
};

module.exports = {
    signup,
    logout,
    login,
    protect,
    restrict,
    forgotPassword,
    resetPassword,
    updatePassword,
    sendTokenResponse,
};

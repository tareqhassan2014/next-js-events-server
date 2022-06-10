// create a user model

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            minlength: [3, 'Name must be at least 3 characters long'],
            maxlength: [25, 'Name must be less than 25 characters long'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
        },
        photo: {
            type: String,
            default: 'https://i.ibb.co/dBQjP3N/profile.png',
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Password confirmation is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
        },
        role: {
            type: String,
            enum: {
                values: [
                    'user',
                    'admin',
                    'super-admin',
                    'vendor',
                    'moderator',
                    'member',
                ],
                message: 'Invalid role',
            },
            default: 'user',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            // remove unused fields
            transform: (doc, ret) => {
                delete ret.__v;
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.id;
                delete ret.password;
                delete ret.active;

                return ret;
            },
        },
        toObject: {
            virtuals: true,
            // remove unused fields
            transform: (doc, ret) => {
                delete ret.__v;
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.id;
                delete ret.active;

                return ret;
            },
        },
    }
);

// virtual populate
userSchema.virtual('hostel', {
    ref: 'Hostel',
    foreignField: 'admin',
    localField: '_id',
});

userSchema.virtual('store', {
    ref: 'Store',
    foreignField: 'vendor',
    localField: '_id',
});

// add a query middleware
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// compare password to passwordConfirm
userSchema.pre('save', function (next) {
    if (this.password !== this.passwordConfirm) {
        next(new Error('Passwords do not match'));
    } else {
        next();
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

userSchema.methods.comparePassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(
        candidatePassword,
        userPassword || this.password
    );
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    const passwordChangedAt = this.passwordChangedAt;
    if (passwordChangedAt) {
        const changedTimeStamp = parseInt(
            passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimeStamp < changedTimeStamp;
    }
    return false;
};

// createPasswordResetToken
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);

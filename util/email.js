// send email
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter object using the default SMTP transport

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        // 2) Define the email sender
        from: `${process.env.MAIL_USER}`,
    });

    // 3) Define the email options
    const mailOptions = {
        from: `${process.env.MAIL_USER}`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage,
    };

    // 4) Actually send the email
    await transporter.sendMail(mailOptions);
};


module.exports = sendEmail;
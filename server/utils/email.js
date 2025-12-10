require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


async function sendVerificationEmail(to, username, token) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const msg = {
        to: to,
        from: process.env.EMAIL_FROM,
        subject: 'Confermation Strava Clone Account',
        html: `
            <div style="font-family: Arial, sans-serif;">
        
        <a href="#">
            <img
                src="https://i.postimg.cc/2yjhqY1C/Gemini_Generated_Image_ifbq17ifbq17ifbq.png"
                style="width: 50px; height: 50px"
                alt="Strava Logo"
            />
        </a>

        <h1>Strava Clone</h1>

        <p>Hi <strong>${username}</strong>,</p>
        <p>Thanks to be part of Strava Clone community, click the link below to verify your email address:</p>

        <a href=${verificationLink} style="color: #FC4C02; font-weight: bold;">
            Confirm Email
        </a>

        <p>If it was not you who requested this registration, ignore this email.</p>

        <div style="margin-top: 20px; color: #666666;">
    <small style="font-style: italic; font-size: 0.7em;">
        <strong>Strava Clone Gmbh</strong>,<br>
        Durlacher Tor 22,<br>
        76131 Karlsruhe, Germany<br>
        All rights reserved
    </small>
</div>
    </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`Verification email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('ERRORE sending email with SendGrid:', error.response ? error.response.body : error);
        throw new Error('Error sending verification email.');
    }
}

module.exports = {
    sendVerificationEmail
};

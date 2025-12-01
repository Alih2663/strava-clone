import * as React from 'react';

interface EmailTemplateProps {
    firstName: string;
    verificationLink: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    firstName,
    verificationLink,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <p>Ciao <strong>{firstName}</strong>,</p>

        <a>
            <img
                src="https://i.postimg.cc/2yjhqY1C/Gemini_Generated_Image_ifbq17ifbq17ifbq.png"
                style={{ width: 50, height: 50 }}
                alt="Strava Logo"
            />
        </a>

        <h1>Strava Clone</h1>

        <p>Thanks to be part of Strava Clone community, click the link below to verify your email address:</p>

        <a href={verificationLink} style={{ color: '#FC4C02', fontWeight: 'bold' }}>
            Conferma Account
        </a>

        <p>If it was not you who requested this registration, ignore this email.</p>
    </div>
);

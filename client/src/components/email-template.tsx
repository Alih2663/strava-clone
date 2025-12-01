import * as React from 'react';

// Definisci tutte le props necessarie
interface EmailTemplateProps {
  firstName: string;
  verificationLink: string; // Aggiunto il link di verifica
}

// Assicurati che il nome del file e del componente sia corretto
export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  verificationLink, // Destruttura anche verificationLink
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif' }}>
    {/* Nota: Ho aggiunto firstName per un tocco personale */}
    <p>Ciao **{firstName}**,</p>

    {/* Contenuto HTML originale */}
    <a>
      <img
        src="https://i.postimg.cc/2yjhqY1C/Gemini_Generated_Image_ifbq17ifbq17ifbq.png"
        style={{ width: 50, height: 50 }} // Stili in formato JSX
        alt="Strava Logo"
      />
    </a>

    <h1>Strava Clone</h1>

    <p>Thanks to be part of Strava Clone community, click the link below to verify your email address:</p>

    {/* Usa la prop verificationLink */}
    <a href={verificationLink} style={{ color: '#FC4C02', fontWeight: 'bold' }}>
      Conferma Account
    </a>

    <p>If it was not you who requested this registration, ignore this email.</p>
  </div>
);
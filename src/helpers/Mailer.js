import nodemailer from 'nodemailer';




const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});


transporter.verify().then(() => {
    console.log("Ready to send emails");
}).catch((error) => {
    console.error("Error verifying SMTP connection:", error);
});


export const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            text: text,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};



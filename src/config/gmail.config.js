import nodemailer from 'nodemailer'
const { NODE_ENV } = process.env;


const isDevelopmentOrTest = NODE_ENV === 'development' || NODE_ENV === 'test'

const transporter = nodemailer.createTransport({
    host: isDevelopmentOrTest ? 'smtp.gmail.com' : 'mail.sjiglobal.com',
    port: isDevelopmentOrTest ? 587 : 465,
    secure: NODE_ENV === 'production', 
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});
export default transporter
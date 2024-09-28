import transporter from '../config/gmail.config.js'
const { GMAIL_USER } = process.env

// Class to handle sending emails
class EmailService {
// Send email
  static async sendEmail ({ to, subject, text }) {
    try {
      const mailOptions = {
        from: GMAIL_USER,
        to,
        subject,
        text
      }

      const info = await transporter.sendMail(mailOptions)
      return info
    } catch (error) {
        console.error(error)
      throw new Error("Fail to send email")
    }
  }
}

export default EmailService
import emailQueue from '../config/emailQueque.config.js'
import EmailService from '../services/emailServices.js'

// Email Worker
emailQueue.process(async (job, done) => {
  try {
    const { to, subject, text } = job.data
    await EmailService.sendEmail({ to, subject, text })
    done()
  } catch (error) {
    console.error('Error enviando el correo:', error)
    done(error)
  }
})

export default emailQueue
import dotenv from 'dotenv'
import { app } from "./app.js"
import { initializeCoordinador } from './init.js'
import { UploadFileasync, uploadCSVToEtapasTv } from './helpers/UploadData.js'
import { updateExpedientes } from './helpers/UpdateData.js';
import cron from 'node-cron';
import { checkAndCancelOverdueTasks } from './helpers/CancelTask.js'; 
dotenv.config()


cron.schedule('0 20 * * 5', async () => { // '0 20 * * 5' es el cron schedule para viernes a las 8 PM
    await updateExpedientes();  
}, {
    scheduled: true,
    timezone: "America/Monterrey" 
});

cron.schedule('0 */12 * * *', () => {
    checkAndCancelOverdueTasks();
});



app.use((req, res, next) => {
    res.status(404).json({
        message: 'endpoint not found'
    })
})

if (process.env.NODE_ENV !== 'test') {
    initializeCoordinador();
}

// ESta funcion se ejecutara cuando se necesite subir data de forma manual. Debe ser un archivo CSV.
// UploadFileasync()
// uploadCSVToEtapasTv()

const PORT = process.env.PORT || 3001


 const server = app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

export { app, server };

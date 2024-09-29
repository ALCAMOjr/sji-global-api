import dotenv from 'dotenv'
import { app } from "./app.js"
import { initializeCoordinador } from './init.js'
// import { updateExpedientes } from './helpers/UpdateData.js';
import cron from 'node-cron';
import { deleteAllFilesInDirectory } from './helpers/Pdfs.js';  
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanJobs, clearWorkspace } from './workers/expedienteWorker.js';
dotenv.config()




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const pdfDirectory = path.join(__dirname, 'pdfs');


if (process.env.NODE_ENV === 'production') {
    await clearWorkspace();

    cron.schedule('0 */12 * * *', async () => {
        await cleanJobs(['failed', 'completed']);
    }, {
        scheduled: true,
        timezone: "America/Monterrey"
    });
} 
cron.schedule('0 * * * *', () => {
    deleteAllFilesInDirectory(pdfDirectory);
}, {
    scheduled: true,
    timezone: "America/Monterrey"
});

app.use((req, res, next) => {
    res.status(404).json({
        message: 'endpoint not found'
    })
})

if (process.env.NODE_ENV !== 'test') {
    initializeCoordinador();
}
const PORT = process.env.PORT || 3001

 const server = app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

export { app, server };

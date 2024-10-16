import express from 'express'
import AbogadosRoutes from './routes/Abogados.routes.js'
import TareasRoutes from "./routes/Tareas.routes.js"
import ExpedienteRuter from "./routes/Expedientes.routes.js"
import ExpedienteSialRouter from "./routes/ExpedienteSial.routes.js"
import PositionRouter from "./routes/PosicionExpediente.routes.js"
import ReporteRouter from "./routes/Reporte.routes.js"
import JuzgadoRouter from "./routes/Juzgado.routes.js"
import FiltrosRouter from "./routes/Filtros.routes.js"
// import DemandaRouter from "./routes/Demandas.router.js"
import cors from "cors";
const app = express()


app.use(cors());
app.use(express.json())
app.use('/api', AbogadosRoutes)
app.use('/api', ExpedienteRuter)
app.use('/api', ExpedienteSialRouter)
app.use('/api', PositionRouter)
app.use('/api', ReporteRouter)
app.use('/api', TareasRoutes)
app.use('/api', JuzgadoRouter)
app.use('/api', FiltrosRouter)
// app.use('/api', DemandaRouter)

export { app };

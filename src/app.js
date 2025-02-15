/** @format */

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

mongoose.set("strictQuery", false);

// Rutas:
import mocksRouter from "./routes/mocks.router.js";
import usersRouter from "./routes/users.router.js";
import petsRouter from "./routes/pets.router.js";
import adoptionsRouter from "./routes/adoption.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import config from "./config/config.js";

const app = express();
const PORT = config.app.PORT;
const CONNECTION_STRING = config.mongo.URL;

mongoose.connect(CONNECTION_STRING);

app.use(express.json());
app.use(cookieParser());
app.use("/api/users", usersRouter);
app.use("/api/pets", petsRouter);
app.use("/api/adoptions", adoptionsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/mocks", mocksRouter);

app.listen(PORT, () => console.log(`Servidor escuchando en el http://localhost:${PORT}`));

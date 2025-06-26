const express = require("express");
const logger = require("morgan");
const app = express();
const connectToMongoDB = require("./config/connectToMongoDB");
require("dotenv").config();

const PORT = 3000;


app.use(express.json());
app.use(logger("dev"));


app.listen(PORT, () => {
  console.log(`server is on port ${PORT}...`);

  connectToMongoDB();
});

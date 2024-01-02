const express = require("express");
const cors = require("cors");
var cron = require("node-cron");
require("dotenv").config();
const app = express();
const path = require("path");
const {
  randomQuestion,
  cronJobSMS,
  cronJobCall,
  cronJobNotification,
  cronJobtest,
} = require("./app/controllers/cron.crontroller.js");
const { userTrack } = require("./app/middleware/userTrack.js");
const bodyParser = require("body-parser");
const { openAiFunction } = require("./app/controllers/openAi.controller.js");
  var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/images", express.static(__dirname + "/app/public/images"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/app/views/assets"));
app.set("views", __dirname + "/app/views");
app.get("/", (req, res) => {
  return res.render("index");
});


app.post("/multi_purpose_chat", openAiFunction);
cron.schedule("* * * * *", () => {
  cronJobSMS();
  cronJobCall();
  cronJobNotification();
});
cron.schedule("* * * * *", () => {
  // randomQuestion();
   // cronJobtest()
});
app.all("*", userTrack);
require("./app/routes/auth.routes")(app);
require("./app/routes/reminder.routes")(app);
require("./app/routes/property.routes")(app);
require("./app/routes/history.routes")(app);

                 

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

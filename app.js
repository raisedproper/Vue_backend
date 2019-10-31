var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
const { mongooseAssociation } = require("mongoose-association");
mongooseAssociation(mongoose);
var io = require("socket.io")(3002);
var soc;
const nsp = io.of("/chat");

nsp.on("connection", function(socket) {
  console.log("socket connected");

  soc = socket;
  require("./routes/socket").start(soc, nsp);
  require("./middleware/notification").start(soc, nsp);
});

var peopleRouter = require("./routes/people");
var authenticationRouter = require("./routes/authentication");
var friendsRouter = require("./routes/friend");
var profileRouter = require("./routes/profile");
var conversationRouter = require("./routes/Conversation");
var followRouter = require("./routes/follow");
var activityRouter = require("./routes/activity");
var indexRouter = require("./routes/index");

mongoose.connect("mongodb://127.0.0.1:27017/mongodb", {
  useNewUrlParser: true
});
mongoose.set("useFindAndModify", false);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public/images")));

app.use("/", indexRouter);
app.use("/people", peopleRouter(soc, nsp));
app.use("/authentication", authenticationRouter);
app.use("/friends", friendsRouter(soc, nsp));
app.use("/profile", profileRouter(soc, nsp));
app.use("/conversation", conversationRouter(soc, nsp));
app.use("/follow", followRouter(soc, nsp));
app.use("/activity", activityRouter(soc, nsp));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const ngrok = require('ngrok');
const { mongooseAssociation } = require('mongoose-association')
mongooseAssociation(mongoose)

var peopleRouter = require('./routes/people');
var authenticationRouter = require('./routes/authentication');
var friendsRouter = require('./routes/friend');
var profileRouter = require('./routes/profile');
var conversationRouter = require('./routes/Conversation');
var messageRouter = require('./routes/message');
var followRouter = require('./routes/follow');
var activityRouter = require('./routes/activity');
var indexRouter = require('./routes/index')

require('./routes/socket')
mongoose.connect('mongodb://127.0.0.1:27017/mongodb', {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/images')));

app.use('/',indexRouter)
app.use('/people', peopleRouter);
app.use('/authentication', authenticationRouter);
app.use('/friends', friendsRouter);
app.use('/profile', profileRouter);
app.use('/conversation',conversationRouter);
app.use('/message',messageRouter);
app.use('/follow',followRouter)
app.use('/activity',activityRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});


module.exports = app;

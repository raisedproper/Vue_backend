var UserModel = require('../models/User')

var routeAuthentication = function(req,res,next){
    var token = req.headers["token"];
    if (!token) {
        return res
          .status(401)
          .send({ authorization: false, message: "No token provided." });
      }
console.log('inside',token)
    UserModel.findOne({token: token}, function(err,resp){
        if(resp){
            console.log('found',resp.emailAddress)
        } else if(!resp){
            console.log("token not authenticated");
            res.json({
              status: 400,
              authorization: false,
              message: "Failed to authenticate token."
            });
        } else if(err){
            console.log("error while authenticating token");
            res.json({
              status: 400,
              authorization: false,
              message: "Failed to authenticate token."
            });
        }
    })
    next()
}

module.exports = routeAuthentication
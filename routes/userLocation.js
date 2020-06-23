var express = require("express");
var router = express.Router();
var UserModel = require("../models/User");
var routeAuthentication = require("../middleware/authentication");

var UserLocationModel = require("../models/UserLocation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

var saltRounds = 10;
router.use(routeAuthentication);


module.exports = function(socket, nsp) {

router.post("/updatelocation", async function(req, res) {
    let { latitude, longitude, distanse, emailAddress } = req.body; 
    emailAddress = toUpper(emailAddress);
    
  
  
    let result = await UserModel.findOne({ emailAddress: emailAddress });
    
     if (result ) {

      //  let locationResult = await UserLocationModel.find({emailAddress: emailAddress,"createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)}});
       let locationResult1 = await UserLocationModel.find({emailAddress: emailAddress,"createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)}}).limit(1).sort({$natural:-1})

console.log('dddddddd');

console.log(locationResult1);


   var isLocationInsert = false;
   let distance1 = 0;
   if(locationResult1.length >0)
   {
     var lat1 = locationResult1[0].latitude;
     var lon1 = locationResult1[0].longitude;
      distance1 = distance(lat1,lon1,latitude,longitude,'Meter')
    if(distance1>100)
    {
      isLocationInsert = true;
    }
  
  
   }
      


      var UserLocation = new UserLocationModel({ 
        userId: result._id,
        emailAddress: emailAddress,
        latitude: latitude,
        longitude: longitude,
        distance: "3",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      if(((locationResult1.length >0) && (isLocationInsert)) || locationResult1.length == 0)
      {
      UserLocation.save(function(err, resp) {
        if (err) {
          console.log("error while saving UserLocation", err);
          res.json({
            status: 400,
            message: "user location not saved"
          });
        } else {
          console.log("User location saved successfully");
          res.json({
            status: 200,
            message: "user location registered successfully",
            response: {
             
              emailAddress: resp.emailAddress,
              id: resp._id
            }
          });
        }
      });
    }
    else{
      console.log("error on location insert dictance less than "+ distance1+ " meter");
      res.json({
        status: 200,
        message: "location not inserted"
      });
    }
    
  
     
    } else {
      console.log("error while finding users location");
      res.json({
        status: 400,
        message: "user not saved"
      });
    }
  });


  router.post("/getUserlocation", async function(req, res) {
    let { emailAddress,date,time } = req.body; 
    emailAddress = toUpper(emailAddress);
    
  
  
    // let result = await UserLocationModel.find({ emailAddress: emailAddress });

    let result = await UserLocationModel.find({emailAddress: emailAddress,"createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)}})
    
     if (result ) {

       mapCorrdinateArray= [];
       result.map( obj => {
       
        let lat = obj.latitude;
        let lon = obj.longitude;
      //  var mapCorrdinateArrayIN= [];
      //  mapCorrdinateArrayIN.push(lon);
      //  mapCorrdinateArrayIN.push(lat);

        var coordinatesObjectArray = {
          "latitude":obj.latitude,
          "longitude":obj.longitude
        }
        mapCorrdinateArray.push(coordinatesObjectArray);

      //  mapCorrdinateArray.push(mapCorrdinateArrayIN);
      
  });

     var responseData = {};
     responseData = {
       'userLocation':result,
       'coordinates':mapCorrdinateArray
     }

      console.log("error while finding users");
      res.json({
        status: 200,
        message: "user data found",
        response:responseData,
        
      });
     
    } else {
      console.log("error while finding users");
      res.json({
        status: 400,
        message: "user not saved"
      });
    }
  });


  
  function distance(lat1, lon1, lat2, lon2, unit) {

    //unit = the unit you desire for results                              
    //:::           where: 'M' is statute miles (default)                        
    //:::                  'K' is kilometers                                      
    //:::                  'N' is nautical miles 
    //:::          'Meter' is Meter

    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      if (unit=="Meter") { dist = dist * 1.609344*1000 }
      return dist;
    }
  }

  function toUpper(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  


  return router;

};
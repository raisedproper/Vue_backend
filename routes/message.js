var express = require("express");
var router = express.Router();

var NeighbourModel = require("../models/Neighbour");

var kmToRadian = function(km){
  var earthRadiusInkm = 6371;
  return km / earthRadiusInkm;
};

router.post("/findUser", function(req, res) {
  console.log('dhhe')

   NeighbourModel.find({"location" : {
    $geoWithin : {
        $centerSphere : [[76.759706,30.727914], kmToRadian(2) ]
    } }}, function(err,resp){
     if(resp){
       console.log('user found',resp)
       res.json({
         message: resp
       })
     } else {
       console.log('error',err)
     }

   })
})

module.exports = router
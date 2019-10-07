var express = require("express");
var router = express.Router();
var date = new Date();
var UserModel = require("../models/User");

router.get("/connections/:id", async (req, res) => {
  var { id } = req.params;
  let ids = [];

  let user = await UserModel.findOne({_id: id})
    .populateAssociation("people")
    let people = await user.people

  /* let people = await user.people.  */
  console.log("user", people);
   people.map(obj => { if(obj.status == 'approved'){ ids.push(obj.id) }})
console.log(people)
console.log('ids',ids)
var ddg = await UserModel.find({'_id': { $in: ids}})
 console.log('arary', ddg)  
});
module.exports = router;

var express = require("express");
var router = express.Router();
var UserModel = require("../../models/User");

router.get("/getUsers", async function(req, res) {
  try {
    var {page,limit} = req.query
   console.log(page,req.query)
   if(page == undefined || page == ''){
     page = 0
   }
   if(limit == undefined || limit == ''){
     limit = 0
   }
  let pagination = await  UserModel.paginate({},{page:page,limit:Number(limit)})

    if (pagination) {
      res.json({
        status: 200,
        message: "users fetched successfully",
        response: pagination
      });
    } else {
      res.json({
        status: 400,
        message: "no users"
      });
    }
  } catch (err) {
    console.log(err)
    res.json({
      status: 404,
      message: "error while fetching users"
    });
  }
});

router.put("/deleteUser/:id", async function(req, res) {
    try{
  var { id } = req.params;
  var {status} = req.body
  if(status == 'deactive'){
  let user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { status: "deactive" } }
  );

  if (user) {
    console.log("user deactivated");
    res.json({
      status: 200,
      message: "user deactivated sucessfully",
      response: status
    });
  } else {
    res.json({
      status: 400,
      message: "user not deactivated "
    });
  }
} else if(status == 'active'){
  let user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { status: "active" } }
  );

  if (user) {
    console.log("user activated");
    res.json({
      status: 200,
      message: "user activated sucessfully",
      response: status
    });
  } else {
    res.json({
      status: 400,
      message: "user not activated "
    });
  }
}
} catch(err){
    res.json({
        status: 404,
        message: "error while deactivating user"
      });
}
});

module.exports = router;

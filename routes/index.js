var express = require("express");
var router = express.Router();

router.get('/', function(req,res){
    res.render('index')
})
router.get('/layout', function(req,res){
    res.render('layout')
})

module.exports = router;
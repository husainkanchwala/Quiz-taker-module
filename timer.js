// // var redis = require('redis').createClient();

// // redis.lindex("Quiz:1222",1,function  (err, result) {
// // 	if(err) console.log("aaaaa");
// // 	else{
// // 		if(result) console.log("bbbbb");
// // 		else console.log("ccccccc");
// // 	}
// // });


// var x = [];
// var y = ["asdasd", "asdasda", "asdadsad"];
// x.push("alpha1");
// x.push(y);
// console.log(x);
// console.log(x.indexOf("alpha"));

var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var path = require('path');
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


/*            here server lies        */

app.get('/',function (req, res){
	res.send(200);
	console.log("ok");
	console.log("ok---");
});
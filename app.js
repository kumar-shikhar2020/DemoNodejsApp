var express = require("express"),
	methodOverride = require("method-override"),
	app = express(),
	bodyparser = require("body-parser"),
	expresssanitizer = require("express-sanitizer"),
	passport = require("passport"),
	LocalStratergy = require("passport-local"),
	passportLocalMongoose = require("passport-local-mongoose"),
	mongoose = require("mongoose");


app.use(require("express-session")({
	secret: "PASSWORD",
	resave: false,
	saveUninitialized: false

}));
app.use(bodyparser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(expresssanitizer());
app.use(passport.initialize());
app.use(passport.session());



//Connect to the Database
mongoose.connect("mongodb://localhost/uranime", { useNewUrlParser : true, useUnifiedTopology: true, useFindAndModify: true});
//define schema for the post
var animeschena = new mongoose.Schema({
	title : String,
	image : String,
	description: String

});

var Anime = mongoose.model("Anime", animeschena);
//definr Schema for user
var userSchema = new mongoose.Schema({
	login: Boolean,
	name: String,
	email: String,
	username: String,
	password: String,
	posts: [{type: mongoose.Schema.Types.ObjectId, ref: "Anime"}]
});
userSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", userSchema);

//passport Setup
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




// Anime.create({title: " NARUTO",  image: "https://coverfiles.alphacoders.com/213/thumb-21358.jpg"}, function(err, res){
// 	if(err)
// 	{
// 		console.log("FOUND AN ERROR");
// 		console.log(err);
// 	}
// 	else
// 	{
// 		console.log("Successfully inserted");
// 		console.log(res);
// 	}
// });

//Signup  - Register




app.get("/register", function(req, res){
	res.render("register");
});

app.post("/register", function(req, res){
	//req.body.username;
	//req.body.password;

	User.register(new User({username: req.body.username, name: req.body.name, email: req.body.email}), req.body.password, function(err, user){
		if(err)
		{
			console.log(err);
			return res.rnder("register");
		}
		passport.authenticate("local")(req, res, function()
		{
			//console.log("Register===\n" + user);
			User.findByIdAndUpdate(user._id, {$set:{login: true}}, function(err, updateduser)
			{
				if(err){ res.rendirect("/");}
				else
				{
					res.redirect("/animelist");
				}
				//res.redirect("/animelist");
			});
		});
	});
});


//Login - Signin
app.get("/login", function(req, res){
	res.render("login");
});


//middleware
app.post("/login", passport.authenticate("local",{
		successRedirect: "/animelist",
		failureRedirect: "/login"
	}) ,function(req, res)
{
	console.log("I am inside login,,,,HELP ME OUT");

});

// LOGOUT
app.get("/logout", function(req, res){

	if(req.user==null) res.redirect("/");
	
	User.findByIdAndUpdate(req.user._id, {$set:{login: false}}, function(err, updateduser)
			{
				// if(err){ res.rendirect("/");}
			// 	else
			// 	{
			// 		res.redirect("/animelist");
			// 	}
			// 	res.redirect("/animelist");
			});

	//console.log("I am inside logout/....GOT HELP" + req.user + res);
	req.logout();
	

	res.redirect("/");
});


//middleware
function isLoggedIn(req, res, next){
	if(req.isAuthenticated())
	{
		// console.log("isLoggedin Fn===="+ req.user);
		User.findByIdAndUpdate(req.user._id, {$set:{login: true}}, function(err, updateduser)
			{
				// if(err){ res.rendirect("/");}
				// else
				// {
				// 	res.redirect("/animelist");
				// }
				// res.redirect("/animelist");
			});
		return next();
	}
	res.redirect("/");

}






//Default Index Page
app.get("/", function(req, res){
	User.find({}, function(err, userlist){
		if(err){ console.log(err);}
		else{
			res.render("index", {userlist, userlist, currentuser: req.user});
		}
	});
	// res.render("index");

});


//CREATE
app.get("/animelist/new", function(req, res){
	res.render("newanime");
});

app.post("/animelist", isLoggedIn, function(req, res){

	req.body.description = req.sanitize(req.body.description);

	var name = req.body.name;
	var image = req.body.image;
	var des = req.body.description;
	var newanime = {title: name,  image:image, description : des};

	//list.push(newanime);

	//res.redirect("/animelist");


	Anime.create(newanime, function(err, newlycreated){
		if(err){console.log(err);}
		else
		{
			res.redirect("/animelist");
		}
	});

});

// READ the Specific
app.get("/animelist/:id", isLoggedIn, function(req, res){

	Anime.findById(req.params.id, function(err, foundpost){
		if(err){ console.log(err);}
		else
		{
			res.render("show", {post : foundpost});
		}
	});
	//res.render("show");
});





//UPDTAE
app.get("/animelist/:id/edit", isLoggedIn, function(req, res){

	Anime.findById(req.params.id, function(err, foundpost){
		if(err){ console.log(err);}
		else{
			res.render("edit", {post: foundpost});
		}

	});
	//res.render("edit");
});

app.put("/animelist/:id", function(req, res){


	//console.log(req.body);
	req.body.post.description = req.sanitize(req.body.post);
	Anime.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatedpost){
		if(err){ res.render("/animelist");}
		else
		{
			res.redirect("/animelist/"+ req.params.id);
		}

	});
	//res.send("UPDATED");
});


//DELETE
app.delete("/animelist/:id", function(req, res){
	Anime.findByIdAndRemove(req.params.id, function(err){
		if(err) res.redirect("/animelist");
		else{
			res.redirect("/animelist");
		}
	});

});



//DISPLAY THE LIST
app.get("/animelist", isLoggedIn, function(req, res){
	//res.render("animelist", {list: list});
	Anime.find({}, function(err, list){
		if(err){ console.log(err);}
		else{
			res.render("animelist", {list, list});
		}
	});
});

app.get("*", function(req, res){
	res.send("404 - Error  <br> Webpage not found");	
});



//Mandatory Listen
app.listen(4000, function(){
	console.log("Serving on PORT 4000");
});



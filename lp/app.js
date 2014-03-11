
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var browserify = require('browserify-middleware');
var app = express();
var nstore = require('nstore');
var templates = nstore.new("data/templates.db", function(){
  console.log("connected to nstore db", templates);
  templates.get("twocol",function (err, doc){
    console.log("getting twocol", err, doc)
    if(err){
      templates.save("twocol", {
        name:"twocol",
        header:null,
        primary:null,
        secondary:null,
        footer:null
      }, function (err){
        if(err) throw err;
      })
    }
  });
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get("/browserify.js", browserify(__dirname+"/public/javascripts/index.js"));
app.get('/:template', function (req, res, next){
  var edit = !!req.query["edit"];
  templates.get(req.params.template, function (err, doc){
    if(err) return next(err);
   // console.log(doc);
    res.render(doc.name,{edit:edit, template:doc});
  });
});

app.get("/:template/editor", function (req, res, next){
  templates.get(req.params.template, function (err, doc){
    if(err) return next(err);
    res.render("editor",{name:doc.name, template:doc});
  });
});

app.post("/:template", function (req, res, next){
  var toSave = JSON.parse(req.body.template);
  toSave.name = req.params.template;
  templates.save(req.params.template,toSave, function (err){
    if(err) return next(err);
    templates.get(req.params.template, function (err, doc){
      if(err) return next(err);
      res.json(doc);
    })
  });
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


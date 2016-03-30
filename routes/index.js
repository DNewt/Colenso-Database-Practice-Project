var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");
var tei = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; ";
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
router.use(upload.single('fileUpload'));

router.get("/",function(req,res){
	client.execute(tei + " (//name[@type='place'])[1] ", function (error, result) {
			if(error){console.error(error);}
			else {
				res.render('index', { title: 'Colenso Project', place: result.result });
			}
		}
	);
});

router.get("/search", function(req,res){

	var searchString = "'" + req.query.searchString + "'";
	var stringAndOr = searchString.replace(" AND ", '\' ftand \'').replace(" OR ", '\' ftor \'').replace(" NOT ", '\' ftnot \'');

	client.execute(tei + "for $t in //TEI[. contains text "+stringAndOr+"] return db:path($t)",
		function (error, result) {
			if(error){
				res.status(500).send(error);
			} else {
				res.render('search', { title: 'Colenso Project', search_results: result.result.split('\n') });
			}
		}
	);
});

router.get("/browse", function(req,res){
    client.execute("XQUERY db:list('Colenso')",
		function (error, result) {
			if(error){
				res.status(500).send(error);
			} else {
				res.render('search', { title: 'Colenso Project', search_results: result.result.split('\n') });
			}
		}
	);
});

router.get("/display/*", function(req,res){
	var path = req.originalUrl.replace('/display', 'Colenso');
	client.execute("XQUERY doc('"+path+"')",
		function (error, result) {
			if(error){
				res.status(500).send(error);
			} else {
				res.render('display', { title: 'Colenso Project', filepath: path, search_results: result.result});
			}
		}
	);
});

router.get("/xquery", function(req,res){
	client.execute(tei + req.query.searchXQuery,
		function (error, result) {
			if(error){
				res.status(500).send(error);
			} else {
				res.render('search', { title: 'Colenso Project', search_results: result.result.split('\n') });
			}
		}
	);
});

router.post("/upload", function(req,res){
	if(req.file){
		var xml_path = req.file.buffer.toString();
		var file_path = req.file.originalname;
		client.execute('ADD TO Colenso/new/'+file_path+' "'+xml_path+'"',
			function (error, result) {
				if(error){
					res.status(500).send(error);
				} else {
					
				}
			}	
		);
	}
});


router.get("/delete/*", function(req,res){
	console.log('PATH:',req.query.path);
	var query = req.originalUrl;
	var clean_query = query.replace('/delete/Colenso/', '');
	console.log("query: "+query);
	console.log("clean_query: "+clean_query);
	client.execute("DELETE "+clean_query,
		function (error, result) {
			if(error){
				res.status(500).send(error);
			} else {
				res.redirect("search");
			}
		}	
	);
	
});


router.get('/download', function(req, res) {
	console.log("downloading");
	var file_path  = req.query.document;
	console.log(file_path);
	client.execute("XQUERY doc('"+file_path+"')",
		function(error, result) {
			if(error){
				console.log("ERRORRRR");
				res.status(500).send(error);
			} else {
				console.log(result.result);
				res.writeHead(200, {
					'Content-Disposition': 'attachment; filename=' + file_path
				});
				console.log("saving doc");
				res.write(result.result);
				res.end();  
			}
		}
	)
});

router.get("/documents/*",function(req,res){
	var xml_path = req.params[0]
	client.execute("XQUERY doc('Colenso/" + xml_path + "')",
		function (error, result) {
			if(error){
				res.status(404).send('Not found');
			}
			else {
				res.set('Content-Type', 'text/xml');
				res.send(result.result)
			}
		}
	);
});

module.exports = router;
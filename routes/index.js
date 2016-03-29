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
		console.log(xml_path);
		client.execute('ADD TO Colenso/new/'+file_path+' "'+xml_path+'"',
			function (error, result) {
				if(error){
				
				} else {
					
				}
			}	
		);
}
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
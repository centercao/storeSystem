const MongoClient = require('mongodb').MongoClient;
var connect = require('mongodb'); //ObjectID
const _ = require('lodash');
const defaulfOptions = {
	host: 'localhost',
	port: 27017,
	db: 'test',
	max: 100,
	min: 1
};
var CRUD =   function(options){
	this.db = null;
	this.ObjectID = null;
	this.client = null;
	options = _.assign({}, defaulfOptions, options);
	let url = `mongodb://${options.host}:${options.port}/${options.db}`;
	MongoClient.connect(url,{useNewUrlParser: true,auth:{user:options.user,password:options.pass}},
		(err, client) => {
		if(err){
			console.log(err);
		}else{
			this.client = client;
			this.db = client.db(options.db);
			this.connect = connect;// mongodb 静态方法
		}
	});
};
module.exports = CRUD;
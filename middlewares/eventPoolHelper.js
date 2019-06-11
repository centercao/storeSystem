/*
var eventPool = require("../utils/eventPoolHelper");
let data = await eventPool.operate(key,{gId:gId});
eventPool.trigger(data.key,message);// dealAlert
*/

let Event = (function(){
	let clientList = {},
		listen,
		trigger,
		remove;
	listen = function( key, fn ){
		if ( !clientList[ key ] ){
			clientList[ key ] = [];
		}
		clientList[ key ].push( fn );
	};
	trigger = function(){
		let key = Array.prototype.shift.call( arguments ),
			fns = clientList[ key ];
		if ( !fns || fns.length === 0 ){
			return false;
		}
		for( let i = 0, fn; fn = fns[ i++ ]; ){
			fn.apply( this, arguments ); // 多个监听对象
		}
	};
	remove = function( key, fn ){
		let fns = clientList[ key ];
		if ( !fns ){
			return false;
		}
		if ( !fn ){
			fns && ( fns.length = 0 );
		}else{
			for ( var l = fns.length - 1; l >=0; l-- ){
				var _fn = fns[ l ];
				if ( _fn === fn ){
					fns.splice( l, 1 );
					break;
				}
			}
		}
	};
	return {
		listen: listen,
		trigger: trigger,
		remove: remove
	}
})();
exports.listen = Event.listen;
exports.trigger = Event.trigger;
exports.operate=function (key,info,delayTime) {
	return new Promise(function(resolve, reject) {
		let backFun = function (message) {
			clearTimeout(time);
			resolve(message);
			Event.remove(key,backFun);
		};
		Event.listen(key,backFun);
		let time = setTimeout(function () {
			let error = '超时';
			reject(error);
			Event.remove(key,backFun);
		},delayTime?delayTime:2000);
	});
};
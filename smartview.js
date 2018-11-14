//es6
/*************************** usage ******************************

用于hash,js操作的统一
在下面实例化了一个全局 smartView, 整个工程都要使用这个变量

假设你要写一个弹窗:
 需要先注册下你的弹窗,给这个弹窗起个名字 比如 egpage ,注意名字不允许重复注册

 var view = smartView.registor('egpage');

ok 现在就可以使用view了, 有三个内置事件可以绑定

 view.sub('init',function(data){}) //初始化
 view.sub('change',function(data){}) //egpage值 改变
 view.sub('destroy',function(){}) //销毁

 这个三个事件相互排斥,不会同时触发.
 现在如果location.hash 中出现 egpage 的修改, 就会分别触发这三个事件

 当然你也可以手动触发这三个事件

 view.fire('init',val) //val可选
 view.fire('change',val)
 view.fire('destroy')

 fire 方法会同时触发sub订阅和地址栏hash相应的修改

 除了内置方法,你也可sub,fire自定义事件,支持跨组件fire事件

 var view2 = smartView.registor('iampage2');

 view2.sub('egpage.init',function(data){});
 view2.sub('egpage.xxx',function(data){});

 view2 就订阅了 view1 的 init, egpage 触发init的时候view2也可以响应
 view2还订阅了view1的自定义事件 xxx , view1触发xxx事件的时候,view2也可以响应.
 尽量不要在viw2 去 fire view 的事件, 最好只做订阅


 进入页面的时候 smartView 会有根据当前hash的初始化一次,触发对应的事件

 初始化时对 a 做了代理 , 支持灵活的增减hash参数
 在参数前添加 — 代表去除此参数
 在参数前添加 + 代表去添加参数

 eg:
 #-egpage 代表去除当前hash的 egpage参数 ,而不是跳转hash到 #-egpage
 #+egpage=2 代表当前hash添加 egpage参数

 比如当前hash "#egpage=1&test=2" 点击 href="#-egpage&impage=2'后
 hash 变为 "#test=2&impage=2"

********************/

//地址分析
class UrlParse{
	//解析 query 部分
	parseHash(url){
		var url = this.getHash(url);
		var param = url.split('&');
		var urlParam = {};
		param.forEach(function(v,i){
			let temp = v.split('=');
			if(temp[0]){
				if(temp[1] == undefined || temp[1] == null){
					temp[1] = ''
				}
				urlParam[temp[0]] = decodeURIComponent(temp[1]);
			}
		});
		return urlParam;
	}
	stringify(urlParam){
		var param = [];
		for (var i in urlParam) {
			var v = urlParam[i];
			if(i !== null && i !== undefined){
				if(i.length && v!=null && v!=undefined){
					param.push(i +'='+ encodeURIComponent(v));
				}else{
					param.push(i);
				}
			}
		}
		return param.join('&');
	}

	getHash(url){
		if(url === undefined){url = document.location.href}
		var hash = url.match(/#(.+)/);
		if(!hash)return '';
		return hash[1] ? hash[1]: '';
	}
}

//a.b.c parse
class KeyParse{
	parse(key) {
		return key.split('.');
	}
}
if(!window.smartViewEvents){
	window.smartViewEvents = {};
}

//简单的地址操作联动类
class SmartView{
	constructor(){
		this.urlparse = new UrlParse();
		this.keyparse = new KeyParse();

		this.hash = '';

		this.events = smartViewEvents;

		this.hashchange();

		this.nativeEvents = ['init','change','destroy'];

	}

	changeHash(hash){
		if(!hash.startsWith('#')){
			hash = '#' + hash;
		}
		location.hash = hash;
		return hash;
	}
	replaceHash(hash){
		if(!hash.startsWith('#')){
			hash = '#' + hash;
		}
		var url = location.origin + location.pathname + hash
		location.replace(url);
		// history.replaceState({},'',url);
		return hash;
	}
	changeHashByParam(param,replace){
		var noNullParam ={};
		for(var i in param ){
			if(!this.isNull(param[i])){
				noNullParam[i] = param[i];
			}
		}
		var hash = this.urlparse.stringify(noNullParam);
		if(replace){
			return this.replaceHash(hash)
		}else{
			return this.changeHash(hash);
		}
	}

	//item 的 fire事件
	itemFire(name,val){
		var keys = this.keyparse.parse(name);
		if(keys.length<2){return}
		if(!this.events[keys[0]])return;
		if(this.nativeEvents.includes(keys[1])){
			if(keys[1] == 'init' && this.isNull(val)){
				val = '';
			}
			if(keys[1] == 'destroy'){
				val = null;
			}

			var newAddParam = {};
			newAddParam[keys[0]] = val;

			this.changeByParam(newAddParam);
		}else{
			//自定义事件
			this.fire(name,val);
		}
	}

	changeByParam(param,replace){

		var newParam  = this.unionKeys(this.urlparse.parseHash(this.hash),param);
		var hash = this.changeHashByParam(newParam,replace);

		this.paramChangeCallback(newParam);
		
		this.hash = hash;
	}

	//根据hash分析参数,分别fire事件
	go(url){
		var param = this.urlparse.parseHash(url);
		var replace = '';
		var newi = '';
		for(var i in param){
			if(param.hasOwnProperty(i) ){
				if(i.indexOf('-') === 0){
					if(i.indexOf('--') === 0){
						newi = i.slice(2);
					}else{
						newi = i.slice(1);
					}
					delete param[i];
					param[newi] = null;
				}
				if(i.indexOf('+') === 0){
					if(i.indexOf('++')===0){
						newi = i.slice(2);
					}else{
						newi = i.slice(1);
					}
					param[newi] = param[i];
					delete param[i];
				}
			}
			//走replace 替换
			if(i.indexOf('--') === 0|| i.indexOf('++') == 0){
				replace = true
			}
		}
		this.changeByParam(param,replace);
	}

	//合并连个数组的key
	unionKeys(obj1,obj2){
		var obj = {};
		for(var i in obj1){
			if(obj1.hasOwnProperty(i)){
				obj[i] = obj1[i];
			}
		}
		for(var i in obj2){
			if(obj2.hasOwnProperty(i)){
				obj[i] = obj2[i];
			}
		}
		return obj;
	}
	isNull(val){
		return val === undefined || val === null;
	}
	paramChangeCallback(param){
		var self = this;
		var oldParam = this.urlparse.parseHash(self.hash);
		var unionParams = this.unionKeys(param,oldParam);

		for(var i in unionParams){
			if(unionParams.hasOwnProperty(i)){
				//原来没有这个数据 触发init
				if( !this.isNull(param[i]) && this.isNull(oldParam[i])){
					self.fire(i+'.'+'init', param[i]);
				}
				if(this.isNull(param[i]) && !this.isNull(oldParam[i])){
					self.fire(i+'.'+'destroy');
				}
				if(!this.isNull(param[i]) && !this.isNull(oldParam[i])&& param[i] !== oldParam[i]){
					self.fire(i+'.'+'change', param[i],oldParam[i]);
				}
			}
		}
	}

	hashchange(){
		var self = this;
		window.addEventListener('hashchange',function(e){
			self.dispathByHash();
		},false);
	}

	//会被外部调用,不能删除
	dispathByHash(){
		var param = this.urlparse.parseHash();
		this.paramChangeCallback(param);
		this.hash = location.hash;
	}

	//************************* 注册 *************************
	registored(name){
		return this.events[name] || false;
	}
	//object 注册
	registor(name){
		if(this.registored(name)){
			throw new Error(name + '已经被注册');
		}
		var item = new SmartViewItem(name,this);
		this.events[name] = item;
		return item;
	}

	//object 注册
	unregistor(name){
		for(var i in this.events){
			if(this.events.hasOwnProperty(i)){
				//删除注册对象和这个对象下的所有事件
				if( i === name || i.indexOf(name+'.') === 0){
					delete this.events[i];
				}
			}
		}
	}
	
	//************************* 事件 *************************
	sub(name,func){
		if(!name.length){
			throw new Error('订阅事件名为空');
		}
		this.events[name] || (this.events[name]=[]);
		this.events[name].push(func);
	}
	on(){
		this.sub(arguments);
	}
	unsub(name,func){
		if(!name.length){
			throw new Error('取消订阅事件名为空');
		}
		var subEvents = this.events[name];
		if(!subEvents || !subEvents.length)return;
		if(!func){
			this.events[name] = [];
			return;
		}
		for(var i in subEvents){
			if(subEvents.hasOwnProperty(i)){
				//删除注册对象和这个对象下的所有事件
				if(subEvents[i] === func ){
					this.events[name].splice(i,1);
				}
			}
		}
	}
	detach(){
		this.unsub(arguments);
	}

	fire(name,val){
		var subEvents = this.events[name];
		if(!subEvents || !subEvents.length)return;
		for(var i=0,len=subEvents.length;i<len;i++){
			subEvents[i](val);
		}
	}
	emit(){
		this.fire(arguments);
	}
}

//注册对象
class SmartViewItem{
	constructor(name,p){
		this.name = name;
		this.p = p;
	}
	getkey(key){
		return key && key.length ? this.name+'.'+key : this.name;
	}
	sub(key,func){
		this.p.sub(this.getkey(key),func)
	}
	on(){
		this.sub(arguments);
	}
	unsub(key,func){
		this.p.unsub(this.getkey(key),func)
	}
	detach(){
		this.unsub(arguments);
	}
	fire(key,val){
		if(key == 'init' && val == undefined){val=''}
		this.p.itemFire(this.getkey(key),val)
	}
	emit(){
		this.fire(arguments);
	}
	//订阅其他组件
	subExt(key,func){
		this.p.sub(key,func)
	}
	unsubExt(key,func){
		this.p.unsub(key,func)
	}
}


//
//var a = smartView.registor('pickupSelector');
//
//a.sub('init',function(e){
//	console.log('init',e);
//});
//a.sub('destroy',function(e){
//	console.log('destroy',e);
//});
//
//a.sub('change',function(e){
//	console.log('change',e);
//});
//
//a.sub('haha',function(e){
//	console.log('haha',e);
//});
//
//var b = smartView.registor('shoppingCart');
//b.sub('init',function(data){
//	console.log('shoppingCart.init',data)
//});
//b.sub('change',function(data){
//	console.log('shoppingCart.change',data)
//});
//
//b.fire('init')
//
////b.subExt('pickupSelector.haha',function(data){
////	console.log('b sub a pickupstore.haha',data)
////});
//
////a.fire('haha','1111');
////a.fire('haha','1111');
//a.fire('change','1111');
//
////smartView.unregistor('pickupSelector');
//
////a.fire('change',22222222);



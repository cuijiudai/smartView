
# smartView

用于hash,js操作的统一

在下面实例化了一个全局 smartView, 整个工程都要使用这个变量

假设你要写一个弹窗:

需要先注册下你的弹窗,给这个弹窗起个名字 比如 egpage ,注意名字不允许重复注册
 
```
 var view = smartView.registor('egpage');
```
ok 现在就可以使用view了, 有三个内置事件可以绑定

```
 view.sub('init',function(data){}) //初始化
 view.sub('change',function(data){}) //egpage值 改变
 view.sub('destroy',function(){}) //销毁
```
 
 这个三个事件相互排斥,不会同时触发.

 现在如果location.hash 中出现 egpage 的修改, 就会分别触发这三个事件

 当然你也可以手动触发这三个事件
```
 view.fire('init',val) //val可选
 view.fire('change',val)
 view.fire('destroy')
```
 fire 方法会同时触发sub订阅和地址栏hash相应的修改

 除了内置方法,你也可sub,fire自定义事件,支持跨组件fire事件
 
```
 var view2 = smartView.registor('iampage2');

 view2.sub('egpage.init',function(data){});
 view2.sub('egpage.xxx',function(data){});
  
```
 view2 就订阅了 view1 的 init, egpage 触发init的时候view2也可以响应
 
 view2还订阅了view1的自定义事件 xxx , view1触发xxx事件的时候,view2也可以响应.
 
 尽量不要在viw2 去 fire view 的事件, 最好只做订阅


 进入页面的时候 smartView 会有根据当前hash的初始化一次,触发对应的事件

 初始化时对 a 做了代理 , 支持灵活的增减hash参数
 
 * 在参数前添加 — 代表去除此参数
 
 * 在参数前添加 + 代表去添加参数

 eg:
 
 #-egpage 代表去除当前hash的 egpage参数 ,而不是跳转hash到 #-egpage
 
 #+egpage=2 代表当前hash添加 egpage参数

 比如当前hash "#egpage=1&test=2" 点击 href="#-egpage&impage=2'后
 hash 变为 "#test=2&impage=2"
 
 
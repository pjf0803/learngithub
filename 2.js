// /fdsafdafdafdsafdsafdasfdsafdsa/afdsafdsafdsafhjdsafdsjkafdhsakjfhdakshdaslkjfdsakjfhdasjlkfhdlsajk/ Return Home随记
// CnBlogsHomeNew PostContactAdminSubscription订阅Posts - 87  Articles - 0  Comments - 17  Views - 19万 
// 删除本地git的远程分支和远程删除git服务器的分支
// 新建分支:

// git checkout -b new

// 它是下面两条命令的简写：fdsafdasfdsafdasfdsafdsafdasfdsafdasds

// git branch new
// git checkout new

// 列出本地分支：

// git branch

// 查看全部分支：

// git branch -a

// 查看本地分支：

// git branch -l

// 查看远程分支：

// git branch -r

// 删除本地分支：

// git branch -D BranchName

// 其中-D也可以是--delete，如：

// git branch --delete BranchName

// 删除本地的远程分支：

// git branch -r -D origin/BranchName

// 远程删除git服务器上的分支：

// git push origin -d BranchName

// 其中-d也可以是--delete，如：

// git push origin --delete BranchName

 

// 注意：git命令区分大小写，例如-D和-d在不同的地方虽然都是删除的意思，并且它们的完整写法都是--delete，但简易写法用错大小写会执行失败。
 

 

// 作者文章首发地址：https://blog.jijian.link

 

// 作者推荐：
// 极简网—专属前端程序员的导航地址

// 压缩图片神器(png/gif/jpg/svg/webp)—使用浏览器压缩图片，无需上传服务器，超快的压缩速度

 

// 分类: 前端开发工具
// 标签: git
// 好文要顶 关注我 收藏该文  
// 极·简
// 关注 - 0
// 粉丝 - 1
// +加关注
// 00
// « 上一篇： Nuxt.js中scss公用文件(不使用官方插件style-resources)
// » 下一篇： CSS3实现PS中的蚁行线动画以及画布的马赛克背景图
// posted @ 2019-08-09 17:46  极·简  Views(2959)  Comments(0)  Edit  收藏
// 刷新评论刷新页面返回顶部
// 登录后才能查看或发表评论，立即 登录 或者 逛逛 博客园首页
// 【推荐】世界读书日活动--记录阅读之路，影响同行之人
// 【推荐】全球最大规模开发者调查启动--你的声音，值得让世界听见！
// 【推荐】大型组态、工控、仿真、CAD\GIS 50万行VC++源码免费下载!
// 【推荐】HMS Core文档众测，有奖征集！人人都是体验官活动
// 【推荐】限时秒杀！国云大数据魔镜，企业级云分析平台

// 园子动态：
// · 致园友们的一封检讨书：都是我们的错
// · 数据库实例 CPU 100% 引发全站故障
// · 发起一个开源项目：博客引擎 fluss

// 最新新闻：
// · 特斯拉：同理心，是傲慢的唯一解药
// · PayPal进军中国市场 官方表态：不与微信、支付宝竞争
// · 滴滴回应"今日爆款"灰度测试：确在探索新电商模式
// · 独家深访：揭秘腾讯第四次战略升级
// · 罗永浩再成被执行人，执行标的超1458万
// » 更多新闻...
// 昵称： 极·简
// 园龄： 7年3个月
// 粉丝： 1
// 关注： 0
// +加关注
// <	2021年4月	>
// 日	一	二	三	四	五	六
// 28	29	30	31	1	2	3
// 4	5	6	7	8	9	10
// 11	12	13	14	15	16	17
// 18	19	20	21	22	23	24
// 25	26	27	28	29	30	1
// 2	3	4	5	6	7	8
// Search
 
// My Tags
// javascript(33)
// nodejs(12)
// html(12)
// css(9)
// vue(5)
// 服务器(4)
// webpack(4)
// gulp(4)
// jquery(4)
// git(3)
// 更多
// PostCategories
// angularjs(1)
// css[3](10)
// hexo(1)
// html[5](13)
// javascript(31)
// jquery(4)
// nodejs(11)
// php(1)
// vue(4)
// 安全相关(1)
// 服务器相关(6)
// 前端开发工具(24)
// 算法(3)
// PostArchives
// 2021/3(1)
// 2020/12(1)
// 2020/10(1)
// 2020/9(1)
// 2020/8(2)
// 2020/7(2)
// 2020/6(3)
// 2020/4(6)
// 2019/12(1)
// 2019/11(3)
// 2019/8(3)
// 2019/6(4)
// 2019/5(2)
// 2019/1(3)
// 2018/10(3)
// 更多
// Recent Comments
// 1. Re:git 中文文件名乱码
// 你好，请问你能说说你是怎么发现这个解决办法的吗？

// --惠灰灰
// 2. Re:javascript使用H5新版媒体接口navigator.mediaDevices.getUserMedia，做扫描二维码，并识别内容
// @栎树 二维码解码文件哦...
// --极·简
// 3. Re:javascript使用H5新版媒体接口navigator.mediaDevices.getUserMedia，做扫描二维码，并识别内容
// 大佬，请问src="llqrcode.js"中的这个js文件是啥啊

// --栎树
// 4. Re:javascript获取手机上媒体设备，摄像头和话筒
// 大佬，请问一下我用了你的代码，在这句 navigator.mediaDevices.enumerateDevices().then(gotDevices).then(getStream).catch(...
// --栎树
// 5. Re:javascript之数组的全部排列组合
// @前端小学生啊 大佬，您这回答没法锁定问题啊。如果代码有问题，欢迎指正。如果运行出错，麻烦贴上错误代码。谢谢。...
// --极·简
// Top Posts
// 1. javascript 之正则表达式匹配不包含特定字符串的字符(14423)
// 2. javascript使用H5新版媒体接口navigator.mediaDevices.getUserMedia，做扫描二维码，并识别内容(12115)
// 3. 我用AI(Adobe Illustrator CS6)合并路径的两个常用方法(11795)
// 4. vscode 添加eslint插件(11084)
// 5. javascript使用historewqreqwreqwreqwry api防止|阻止页面后退(9044)
// 推荐排行榜
// 1. git 中文文件名乱码(3)
// 2. sass-loader使用data引入公用文件或全局变量报错(1)
// 3. javascript使用H5新版媒体接口navigator.mediaDevices.getUserMedia，做扫描二维码，并识别内容(1)
// 4. javascript获取手机上媒体设备，摄像头和话筒(1)
// 5. [转]使用Google Cloud + cloudflare永久免费运行一个网站(1)
// Copyright © 2021 极·简
// Powered by .NET 5.0 on Kubernetes

// dfahskgdfasjfdash

// master
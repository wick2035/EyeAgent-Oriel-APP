/**
 * 健康资讯 API
 * 提供新闻列表、详情、分类、收藏等功能
 */

import request from './request.js'

// ==================== 模拟数据 ====================

// 分类列表
const mockCategories = [
	{ id: 'all', name: '全部', icon: '📰' },
	{ id: 'eye', name: '眼科', icon: '👁️' },
	{ id: 'internal', name: '内科', icon: '💊' },
	{ id: 'surgery', name: '外科', icon: '🏥' },
	{ id: 'health', name: '养生保健', icon: '🍵' },
	{ id: 'nutrition', name: '营养膳食', icon: '🥗' },
	{ id: 'psychology', name: '心理健康', icon: '🧠' }
]

// 热门标签
const mockHotTags = [
	'近视防控', '白内障', '青光眼', '干眼症', 
	'糖尿病', '高血压', '心脏病',
	'养生', '运动健康', '饮食营养'
]

// 模拟新闻数据
const mockNewsData = [
	{
		id: 1,
		title: '秋冬季节如何预防流感？专家给你支招',
		summary: '随着气温下降，流感病毒开始活跃。专家建议从加强个人卫生、接种疫苗、增强免疫力等方面做好预防工作。本文详细介绍了科学的预防措施...',
		content: `
			<h2>流感高发季节来临</h2>
			<p>每年秋冬季节都是流感的高发期，气温骤降使得人体抵抗力下降，同时室内通风不良，为流感病毒传播创造了条件。</p>
			
			<h3>预防措施一：接种流感疫苗</h3>
			<p>接种流感疫苗是预防流感最有效的手段。建议每年9-10月份接种，老人、儿童、孕妇等高危人群应优先接种。</p>
			<img src="https://picsum.photos/800/500?random=1" alt="流感疫苗" />
			
			<h3>预防措施二：保持良好卫生习惯</h3>
			<ul>
				<li>勤洗手，使用肥皂和流动水洗手至少20秒</li>
				<li>避免用手触摸眼睛、鼻子和嘴巴</li>
				<li>咳嗽或打喷嚏时用纸巾或肘部遮挡</li>
				<li>保持室内空气流通，每天开窗通风</li>
			</ul>
			
			<h3>预防措施三：增强免疫力</h3>
			<p>合理饮食、充足睡眠、适量运动都有助于提高免疫力。多吃新鲜蔬菜水果，保证每天7-8小时睡眠。</p>
			
			<blockquote>
				<p>专家提醒：如果出现发热、咳嗽、咽痛等流感症状，应及时就医，避免传染他人。</p>
			</blockquote>
			
			<h3>特别注意事项</h3>
			<p>老年人和儿童是流感的高危人群，一旦感染容易出现并发症。家中有这些人群的，更要做好防护措施。</p>
		`,
		cover: 'https://picsum.photos/800/450?random=1',
		images: [],
		video: null,
		type: 'article', // article, gallery, video
		category: 'internal',
		categoryName: '内科',
		tags: ['流感', '预防', '健康', '疫苗'],
		source: '健康时报',
		author: '张医生',
		authorTitle: '主任医师',
		publishTime: '2024-01-15 10:30:00',
		viewCount: 12845,
		likeCount: 892,
		commentCount: 156,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 2,
		title: '每天喝多少水才健康？这个数字你要记住',
		summary: '正确的饮水习惯对健康至关重要。成年人每天应该喝多少水？什么时候喝水最好？喝水有哪些讲究？让我们一起来了解科学的饮水方法...',
		content: `
			<h2>科学饮水，健康生活</h2>
			<p>水是生命之源，人体70%都是水分。正确的饮水习惯对维持身体健康、促进新陈代谢至关重要。</p>
			
			<h3>每天应该喝多少水？</h3>
			<p>根据《中国居民膳食指南》建议：</p>
			<ul>
				<li>成年男性：每天约1700ml（约8杯水）</li>
				<li>成年女性：每天约1500ml（约7杯水）</li>
				<li>孕妇：在此基础上增加300ml</li>
				<li>哺乳期妇女：在此基础上增加600-800ml</li>
			</ul>
			
			<img src="https://picsum.photos/800/500?random=2" alt="健康饮水" />
			
			<h3>什么时候喝水最好？</h3>
			<p>以下时间点喝水，效果更佳：</p>
			<ol>
				<li><strong>晨起一杯水</strong>：补充夜间流失的水分，促进肠道蠕动</li>
				<li><strong>饭前半小时</strong>：有助于控制食量，促进消化</li>
				<li><strong>运动后</strong>：及时补充流失的水分</li>
				<li><strong>睡前1小时</strong>：避免夜间口渴，但不要喝太多</li>
			</ol>
			
			<h3>喝水的注意事项</h3>
			<blockquote>
				<p>不要等到口渴才喝水，口渴时身体已经处于轻度脱水状态。应该养成主动喝水的习惯。</p>
			</blockquote>
			
			<p>避免以下错误饮水方式：</p>
			<ul>
				<li>❌ 一次性大量饮水</li>
				<li>❌ 喝冰水或过烫的水</li>
				<li>❌ 用饮料代替白开水</li>
				<li>❌ 长期饮用纯净水</li>
			</ul>
		`,
		cover: 'https://picsum.photos/800/450?random=2',
		images: [],
		video: null,
		type: 'article',
		category: 'health',
		categoryName: '养生保健',
		tags: ['饮水', '健康', '养生'],
		source: '医学科普',
		author: '李营养师',
		authorTitle: '高级营养师',
		publishTime: '2024-01-15 08:20:00',
		viewCount: 8932,
		likeCount: 654,
		commentCount: 89,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 3,
		title: '近视手术全攻略：你适合哪种手术方式？',
		summary: '近视手术已经成为越来越多人摘镜的选择。目前主流的近视手术方式有哪几种？各有什么优缺点？术前需要做哪些准备？让眼科专家为你详细解答...',
		content: `
			<h2>近视手术的发展与现状</h2>
			<p>随着医疗技术的进步，近视手术已经非常成熟和安全。全球每年有数百万人通过近视手术重获清晰视力。</p>
			
			<h3>主流手术方式对比</h3>
			<img src="https://picsum.photos/800/500?random=3" alt="近视手术" />
			
			<h4>1. 全飞秒激光手术（SMILE）</h4>
			<p><strong>适合人群：</strong>近视600度以内，角膜厚度足够的人群</p>
			<p><strong>优点：</strong></p>
			<ul>
				<li>微创，切口仅2-4mm</li>
				<li>术后恢复快，第二天即可正常用眼</li>
				<li>干眼症状轻</li>
				<li>术后角膜生物力学稳定性好</li>
			</ul>
			<p><strong>缺点：</strong>价格较高，对医生技术要求高</p>
			
			<h4>2. 半飞秒激光手术（FS-LASIK）</h4>
			<p><strong>适合人群：</strong>近视1200度以内，散光600度以内</p>
			<p><strong>优点：</strong></p>
			<ul>
				<li>适应范围广</li>
				<li>可以个性化定制</li>
				<li>价格适中</li>
			</ul>
			<p><strong>缺点：</strong>有角膜瓣，需要掀开角膜</p>
			
			<h4>3. 晶体植入手术（ICL）</h4>
			<p><strong>适合人群：</strong>高度近视（800度以上），角膜薄不适合激光手术者</p>
			<p><strong>优点：</strong></p>
			<ul>
				<li>不切削角膜</li>
				<li>可逆，可以取出</li>
				<li>视觉质量优秀</li>
			</ul>
			<p><strong>缺点：</strong>价格最高，需要定期复查</p>
			
			<blockquote>
				<p>专家建议：选择手术方式不能只看价格，要综合考虑自身条件。术前一定要做全面检查，听从医生建议。</p>
			</blockquote>
			
			<h3>术前准备</h3>
			<ol>
				<li>停戴隐形眼镜（软镜1周，硬镜3周）</li>
				<li>进行全面的术前检查（约2小时）</li>
				<li>排除手术禁忌症</li>
				<li>保持良好作息，手术当天不化妆</li>
			</ol>
			
			<h3>术后护理</h3>
			<p>手术后需要注意：</p>
			<ul>
				<li>按时滴眼药水</li>
				<li>避免揉眼睛</li>
				<li>避免剧烈运动</li>
				<li>定期复查</li>
				<li>注意用眼卫生</li>
			</ul>
		`,
		cover: 'https://picsum.photos/800/450?random=3',
		images: [],
		video: null,
		type: 'article',
		category: 'eye',
		categoryName: '眼科',
		tags: ['近视', '手术', '全飞秒', 'ICL', '激光'],
		source: '眼科在线',
		author: '王主任',
		authorTitle: '眼科主任医师',
		publishTime: '2024-01-14 15:45:00',
		viewCount: 15678,
		likeCount: 1234,
		commentCount: 267,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 4,
		title: '干眼症不是小问题！这些症状要警惕',
		summary: '长期看电脑、玩手机导致眼睛干涩？小心干眼症找上门！干眼症不仅影响生活质量，严重时还可能损害视力。了解干眼症的症状和预防方法...',
		content: `
			<h2>什么是干眼症？</h2>
			<p>干眼症是指由于泪液分泌不足或蒸发过快，导致眼表缺乏足够润滑而引起的一系列症状。</p>
			
			<img src="https://picsum.photos/800/500?random=4" alt="干眼症" />
			
			<h3>干眼症的常见症状</h3>
			<p>如果你有以下症状，可能患有干眼症：</p>
			<ul>
				<li>👁️ 眼睛干涩、异物感</li>
				<li>😢 容易流泪（反射性流泪）</li>
				<li>🔥 眼睛灼热、发痒</li>
				<li>😫 视物模糊，眨眼后暂时好转</li>
				<li>💡 畏光，对光线敏感</li>
				<li>😴 早晨起床时眼睑粘连</li>
			</ul>
			
			<h3>干眼症的诱因</h3>
			<p>以下因素会增加干眼症风险：</p>
			<ol>
				<li><strong>长时间使用电子设备</strong>：看屏幕时眨眼次数减少60%</li>
				<li><strong>环境因素</strong>：空调房、雾霾天气</li>
				<li><strong>年龄因素</strong>：40岁以上人群高发</li>
				<li><strong>激素变化</strong>：孕期、更年期女性</li>
				<li><strong>药物影响</strong>：某些抗过敏药、降压药</li>
			</ol>
			
			<h3>如何预防干眼症？</h3>
			<blockquote>
				<p>预防干眼症，关键在于改善用眼习惯和环境。</p>
			</blockquote>
			
			<h4>生活习惯调整</h4>
			<ul>
				<li>🖥️ 使用电子设备时，每20分钟休息20秒，看20英尺（6米）外的物体</li>
				<li>💧 有意识地多眨眼，每分钟15-20次</li>
				<li>💤 保证充足睡眠，避免熬夜</li>
				<li>🚰 多喝水，保持身体水分</li>
			</ul>
			
			<h4>环境改善</h4>
			<ul>
				<li>使用加湿器，保持室内湿度50-60%</li>
				<li>避免风扇或空调直吹面部</li>
				<li>外出佩戴防护眼镜</li>
			</ul>
			
			<h3>干眼症的治疗</h3>
			<p>根据严重程度，治疗方法包括：</p>
			<ul>
				<li><strong>轻度：</strong>人工泪液、热敷</li>
				<li><strong>中度：</strong>抗炎眼药水、泪道栓塞</li>
				<li><strong>重度：</strong>强脉冲光治疗、手术治疗</li>
			</ul>
			
			<img src="https://picsum.photos/800/500?random=5" alt="眼部护理" />
			
			<p><strong>温馨提示：</strong>如果干眼症状持续超过2周，应及时就医，避免病情加重。</p>
		`,
		cover: 'https://picsum.photos/800/450?random=4',
		images: [],
		video: null,
		type: 'article',
		category: 'eye',
		categoryName: '眼科',
		tags: ['干眼症', '眼部健康', '预防', '护眼'],
		source: '眼健康中心',
		author: '陈医生',
		authorTitle: '眼科副主任医师',
		publishTime: '2024-01-14 10:15:00',
		viewCount: 9876,
		likeCount: 567,
		commentCount: 123,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 5,
		title: '高血压患者的饮食禁忌，这些食物要少吃',
		summary: '高血压是常见的慢性病，饮食控制是治疗的重要环节。哪些食物会升高血压？高血压患者应该如何调整饮食？看看营养专家的建议...',
		content: `
			<h2>高血压与饮食的关系</h2>
			<p>研究表明，不良的饮食习惯是导致高血压的重要因素之一。通过调整饮食，可以有效控制血压。</p>
			
			<h3>高血压患者应避免的食物</h3>
			<img src="https://picsum.photos/800/500?random=6" alt="饮食健康" />
			
			<h4>1. 高盐食物 ⚠️</h4>
			<p>盐分摄入过多会导致水钠潴留，血压升高。</p>
			<ul>
				<li>腌制食品：咸菜、腊肉、火腿</li>
				<li>加工食品：方便面、薯片、罐头</li>
				<li>调味品：酱油、蚝油、味精过量使用</li>
			</ul>
			<p><strong>建议：</strong>每天食盐摄入量不超过6克（约一啤酒瓶盖）</p>
			
			<h4>2. 高脂肪食物</h4>
			<ul>
				<li>动物内脏：肝、肾、脑等</li>
				<li>肥肉、动物油</li>
				<li>油炸食品</li>
			</ul>
			
			<h4>3. 刺激性食物</h4>
			<ul>
				<li>浓茶、浓咖啡</li>
				<li>辛辣调料</li>
				<li>烈性酒</li>
			</ul>
			
			<h4>4. 高糖食物</h4>
			<ul>
				<li>甜点、糕点</li>
				<li>含糖饮料</li>
				<li>糖果</li>
			</ul>
			
			<h3>推荐食物清单 ✅</h3>
			<blockquote>
				<p>DASH饮食法（膳食疗法控制高血压）被证实能有效降低血压。</p>
			</blockquote>
			
			<h4>优质蛋白</h4>
			<ul>
				<li>鱼类（三文鱼、鳕鱼）</li>
				<li>去皮鸡肉</li>
				<li>豆制品</li>
				<li>低脂牛奶</li>
			</ul>
			
			<h4>新鲜蔬菜</h4>
			<ul>
				<li>芹菜：含有降压成分芹菜素</li>
				<li>菠菜：富含钾，有助于排钠</li>
				<li>西红柿：含有番茄红素</li>
				<li>黑木耳：软化血管</li>
			</ul>
			
			<h4>水果</h4>
			<ul>
				<li>香蕉：富含钾</li>
				<li>苹果：含有果胶</li>
				<li>猕猴桃：维生素C丰富</li>
			</ul>
			
			<img src="https://picsum.photos/800/500?random=7" alt="健康饮食" />
			
			<h3>一日三餐建议</h3>
			<p><strong>早餐：</strong>燕麦粥 + 煮鸡蛋 + 低脂牛奶</p>
			<p><strong>午餐：</strong>糙米饭 + 清蒸鱼 + 炒青菜 + 紫菜汤</p>
			<p><strong>晚餐：</strong>杂粮粥 + 凉拌芹菜 + 清炒豆腐</p>
			
			<h3>烹饪小技巧</h3>
			<ol>
				<li>多用蒸、煮、炖的方式，少用煎、炸</li>
				<li>用醋、柠檬汁替代部分盐</li>
				<li>使用天然香料提味（姜、蒜、八角）</li>
				<li>餐后水果代替甜点</li>
			</ol>
			
			<blockquote>
				<p>重要提示：饮食调整是辅助手段，不能替代药物治疗。高血压患者应在医生指导下规范用药。</p>
			</blockquote>
		`,
		cover: 'https://picsum.photos/800/450?random=5',
		images: [],
		video: null,
		type: 'article',
		category: 'internal',
		categoryName: '内科',
		tags: ['高血压', '饮食', '健康', '营养'],
		source: '营养健康',
		author: '赵营养师',
		authorTitle: '临床营养师',
		publishTime: '2024-01-13 14:30:00',
		viewCount: 11234,
		likeCount: 789,
		commentCount: 145,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 6,
		title: '运动健身指南：不同年龄段的最佳运动方案',
		summary: '运动是健康生活的重要组成部分，但不同年龄段适合的运动方式不同。如何选择适合自己的运动？运动时有哪些注意事项？专业教练为你解答...',
		content: `
			<h2>科学运动，健康一生</h2>
			<p>适量运动可以增强体质、预防疾病、延缓衰老。但运动方式要因人而异，根据年龄、体质选择合适的运动项目。</p>
			
			<img src="https://picsum.photos/800/500?random=8" alt="运动健身" />
			
			<h3>儿童青少年（6-18岁）</h3>
			<h4>推荐运动</h4>
			<ul>
				<li>🏀 球类运动：篮球、足球、乒乓球</li>
				<li>🏃 跑步、跳绳</li>
				<li>🏊 游泳</li>
				<li>🤸 体操、舞蹈</li>
			</ul>
			<p><strong>运动时间：</strong>每天至少1小时中高强度运动</p>
			<p><strong>注意事项：</strong></p>
			<ul>
				<li>避免过早专项化训练</li>
				<li>注意生长期骨骼保护</li>
				<li>多样化运动，全面发展</li>
			</ul>
			
			<h3>青年人（18-40岁）</h3>
			<h4>推荐运动</h4>
			<ul>
				<li>💪 力量训练：健身房器械、自重训练</li>
				<li>🏃‍♂️ 有氧运动：跑步、骑行、游泳</li>
				<li>🧘 瑜伽、普拉提</li>
				<li>🥊 搏击运动</li>
			</ul>
			<p><strong>运动时间：</strong>每周至少150分钟中等强度或75分钟高强度运动</p>
			<p><strong>运动计划示例：</strong></p>
			<ul>
				<li>周一三五：力量训练45分钟</li>
				<li>周二四：有氧运动30-40分钟</li>
				<li>周末：户外活动或球类运动</li>
			</ul>
			
			<blockquote>
				<p>上班族提示：久坐后要及时活动，每小时起身活动5-10分钟。</p>
			</blockquote>
			
			<h3>中年人（40-65岁）</h3>
			<img src="https://picsum.photos/800/500?random=9" alt="中年运动" />
			
			<h4>推荐运动</h4>
			<ul>
				<li>🚶 快走、慢跑</li>
				<li>🚴 骑行</li>
				<li>🏊 游泳（对关节友好）</li>
				<li>🧘 瑜伽、太极拳</li>
				<li>💃 广场舞</li>
			</ul>
			<p><strong>运动时间：</strong>每天30-45分钟，每周5次以上</p>
			<p><strong>注意事项：</strong></p>
			<ul>
				<li>运动前充分热身</li>
				<li>避免高强度运动</li>
				<li>关注心率变化</li>
				<li>有慢性病者需咨询医生</li>
			</ul>
			
			<h3>老年人（65岁以上）</h3>
			<h4>推荐运动</h4>
			<ul>
				<li>🚶‍♀️ 散步</li>
				<li>🧘 太极拳、八段锦</li>
				<li>🏊 水中慢走</li>
				<li>🎯 平衡性训练</li>
			</ul>
			<p><strong>运动时间：</strong>每天20-30分钟，量力而行</p>
			<p><strong>安全提示：</strong></p>
			<ul>
				<li>避免空腹运动</li>
				<li>穿防滑鞋</li>
				<li>结伴运动更安全</li>
				<li>出现不适立即停止</li>
			</ul>
			
			<h3>通用运动原则</h3>
			<ol>
				<li><strong>循序渐进：</strong>从低强度开始，逐步增加</li>
				<li><strong>持之以恒：</strong>运动贵在坚持</li>
				<li><strong>因人制宜：</strong>选择适合自己的运动</li>
				<li><strong>适度原则：</strong>避免过度运动</li>
				<li><strong>安全第一：</strong>做好防护措施</li>
			</ol>
			
			<img src="https://picsum.photos/800/500?random=10" alt="健康生活" />
			
			<h3>运动损伤预防</h3>
			<ul>
				<li>充分热身和拉伸</li>
				<li>使用合适的装备</li>
				<li>选择安全的场地</li>
				<li>掌握正确的动作技巧</li>
				<li>感到疼痛立即停止</li>
			</ul>
			
			<blockquote>
				<p>运动是最好的药物，但要选对方式、把握好度。健康运动，快乐生活！</p>
			</blockquote>
		`,
		cover: 'https://picsum.photos/800/450?random=6',
		images: [],
		video: null,
		type: 'article',
		category: 'health',
		categoryName: '养生保健',
		tags: ['运动', '健身', '健康', '养生'],
		source: '运动健康',
		author: '刘教练',
		authorTitle: '国家级健身教练',
		publishTime: '2024-01-13 09:00:00',
		viewCount: 13567,
		likeCount: 1089,
		commentCount: 234,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 7,
		title: '糖尿病前期如何逆转？医生教你3个方法',
		summary: '糖尿病前期是糖尿病的前奏，但这个阶段通过生活方式干预，还有机会逆转。如何判断是否处于糖尿病前期？有哪些有效的干预措施？',
		content: `
			<h2>什么是糖尿病前期？</h2>
			<p>糖尿病前期是介于正常血糖和糖尿病之间的一个阶段，空腹血糖在6.1-7.0 mmol/L，或餐后2小时血糖在7.8-11.1 mmol/L。</p>
			
			<blockquote>
				<p>重要：糖尿病前期约有30-50%的人会在5-10年内发展为糖尿病，但通过干预可以降低58%的风险！</p>
			</blockquote>
			
			<img src="https://picsum.photos/800/500?random=11" alt="血糖监测" />
			
			<h3>方法一：饮食调整</h3>
			<h4>控制总热量</h4>
			<p>根据体重计算每日所需热量：</p>
			<ul>
				<li>轻体力劳动：25-30千卡/公斤体重/天</li>
				<li>中体力劳动：30-35千卡/公斤体重/天</li>
				<li>重体力劳动：35-40千卡/公斤体重/天</li>
			</ul>
			
			<h4>优化饮食结构</h4>
			<ul>
				<li>✅ 增加：全谷物、蔬菜、豆类</li>
				<li>✅ 适量：瘦肉、鱼类、蛋类</li>
				<li>❌ 减少：精白米面、甜食、油炸食品</li>
				<li>❌ 避免：含糖饮料、糕点</li>
			</ul>
			
			<h4>推荐食物</h4>
			<table>
				<tr><th>类别</th><th>推荐食物</th></tr>
				<tr><td>主食</td><td>燕麦、糙米、全麦面包、红薯</td></tr>
				<tr><td>蔬菜</td><td>苦瓜、芹菜、菠菜、西兰花</td></tr>
				<tr><td>蛋白质</td><td>鱼类、鸡胸肉、豆腐、鸡蛋</td></tr>
				<tr><td>水果</td><td>苹果、梨、柚子（适量）</td></tr>
			</table>
			
			<h3>方法二：规律运动</h3>
			<img src="https://picsum.photos/800/500?random=12" alt="运动降糖" />
			
			<h4>有氧运动</h4>
			<p>每周至少5天，每次30-45分钟：</p>
			<ul>
				<li>快走（首选）</li>
				<li>慢跑</li>
				<li>骑自行车</li>
				<li>游泳</li>
			</ul>
			
			<h4>力量训练</h4>
			<p>每周2-3次，增加肌肉量可提高胰岛素敏感性：</p>
			<ul>
				<li>深蹲</li>
				<li>俯卧撑</li>
				<li>哑铃训练</li>
			</ul>
			
			<h4>运动时机</h4>
			<p>最佳运动时间：餐后1-2小时，此时血糖较高，运动降糖效果最好。</p>
			
			<h3>方法三：生活习惯改善</h3>
			<h4>1. 控制体重</h4>
			<p>体重每减轻5-10%，可显著改善血糖。</p>
			<p><strong>健康减重速度：</strong>每周0.5-1公斤</p>
			
			<h4>2. 保证睡眠</h4>
			<ul>
				<li>每天7-8小时睡眠</li>
				<li>睡眠不足会影响血糖调节</li>
				<li>避免熬夜</li>
			</ul>
			
			<h4>3. 管理压力</h4>
			<ul>
				<li>压力会升高血糖</li>
				<li>学习放松技巧</li>
				<li>保持良好心态</li>
			</ul>
			
			<h4>4. 戒烟限酒</h4>
			<ul>
				<li>吸烟增加糖尿病风险</li>
				<li>限制酒精摄入</li>
			</ul>
			
			<h3>监测指标</h3>
			<p>干预期间需要定期监测：</p>
			<ul>
				<li>📊 空腹血糖：每月1-2次</li>
				<li>📊 餐后血糖：每周2-3次</li>
				<li>📊 糖化血红蛋白：每3个月</li>
				<li>⚖️ 体重：每周</li>
				<li>📏 腰围：每月</li>
			</ul>
			
			<blockquote>
				<p>成功案例：张先生，45岁，通过3个月的生活方式干预，空腹血糖从6.5降至5.4，体重减轻8公斤，成功逆转糖尿病前期！</p>
			</blockquote>
			
			<h3>何时需要药物干预？</h3>
			<p>如果生活方式干预3-6个月后血糖仍不达标，或具有以下高危因素，需考虑药物治疗：</p>
			<ul>
				<li>糖化血红蛋白≥6.5%</li>
				<li>有糖尿病家族史</li>
				<li>超重或肥胖（BMI≥28）</li>
				<li>年龄≥60岁</li>
			</ul>
			
			<p><strong>温馨提示：</strong>定期体检，早发现、早干预，可以有效预防糖尿病！</p>
		`,
		cover: 'https://picsum.photos/800/450?random=7',
		images: [],
		video: null,
		type: 'article',
		category: 'internal',
		categoryName: '内科',
		tags: ['糖尿病', '血糖', '预防', '健康管理'],
		source: '内分泌科普',
		author: '孙医生',
		authorTitle: '内分泌科主任',
		publishTime: '2024-01-12 16:20:00',
		viewCount: 10987,
		likeCount: 876,
		commentCount: 198,
		isFavorite: false,
		isLiked: false
	},
	{
		id: 8,
		title: '失眠怎么办？5个方法让你一觉到天亮',
		summary: '长期失眠影响身心健康，如何改善睡眠质量？除了数羊，还有哪些科学有效的助眠方法？心理专家分享实用技巧...',
		content: `
			<h2>失眠的危害</h2>
			<p>长期失眠不仅影响精神状态，还会增加心血管疾病、糖尿病、抑郁症等风险。</p>
			
			<img src="https://picsum.photos/800/500?random=13" alt="睡眠健康" />
			
			<h3>方法1：建立睡眠作息</h3>
			<h4>固定睡眠时间</h4>
			<ul>
				<li>每天同一时间上床睡觉</li>
				<li>同一时间起床（包括周末）</li>
				<li>培养生物钟规律</li>
			</ul>
			
			<h4>睡前准备</h4>
			<p>睡前1-2小时开始准备：</p>
			<ol>
				<li>调暗灯光</li>
				<li>降低室温（18-22℃最佳）</li>
				<li>进行放松活动</li>
			</ol>
			
			<h3>方法2：优化睡眠环境</h3>
			<h4>卧室设置</h4>
			<ul>
				<li>🌙 避光：使用遮光窗帘</li>
				<li>🔇 降噪：耳塞或白噪音</li>
				<li>🌡️ 温度：保持凉爽</li>
				<li>🛏️ 床品：舒适的床垫和枕头</li>
			</ul>
			
			<h4>减少干扰</h4>
			<ul>
				<li>移除电子设备</li>
				<li>关闭通知提醒</li>
				<li>卧室只用于睡眠</li>
			</ul>
			
			<blockquote>
				<p>提示：如果20分钟内无法入睡，起床做些放松活动，有睡意再回床上。</p>
			</blockquote>
			
			<h3>方法3：调整生活习惯</h3>
			<img src="https://picsum.photos/800/500?random=14" alt="健康作息" />
			
			<h4>饮食注意</h4>
			<ul>
				<li>✅ 晚餐：清淡，不过饱</li>
				<li>✅ 睡前：可喝温牛奶</li>
				<li>❌ 避免：咖啡因（下午3点后）</li>
				<li>❌ 避免：酒精、辛辣食物</li>
				<li>❌ 避免：睡前大量饮水</li>
			</ul>
			
			<h4>运动时机</h4>
			<ul>
				<li>白天适量运动有助睡眠</li>
				<li>避免睡前3小时剧烈运动</li>
				<li>推荐：瑜伽、散步</li>
			</ul>
			
			<h3>方法4：放松技巧</h3>
			<h4>深呼吸法</h4>
			<p>4-7-8呼吸法：</p>
			<ol>
				<li>用鼻子吸气4秒</li>
				<li>屏住呼吸7秒</li>
				<li>用嘴呼气8秒</li>
				<li>重复4次</li>
			</ol>
			
			<h4>渐进性肌肉放松</h4>
			<p>从脚到头，依次绷紧和放松各部位肌肉。</p>
			
			<h4>冥想</h4>
			<ul>
				<li>专注呼吸</li>
				<li>引导想象</li>
				<li>正念冥想</li>
			</ul>
			
			<h3>方法5：认知调整</h3>
			<h4>改变睡眠认知</h4>
			<ul>
				<li>不要对睡眠过分焦虑</li>
				<li>接受偶尔的失眠</li>
				<li>不要强迫自己入睡</li>
			</ul>
			
			<h4>睡眠日记</h4>
			<p>记录：</p>
			<ul>
				<li>上床时间、入睡时间</li>
				<li>夜间醒来次数</li>
				<li>早晨醒来时间</li>
				<li>白天活动情况</li>
			</ul>
			<p>找出影响睡眠的因素。</p>
			
			<h3>何时需要就医？</h3>
			<p>如果出现以下情况，建议就医：</p>
			<ul>
				<li>失眠持续超过1个月</li>
				<li>严重影响日常生活</li>
				<li>伴有其他症状（打鼾、呼吸暂停等）</li>
				<li>自我调节无效</li>
			</ul>
			
			<img src="https://picsum.photos/800/500?random=15" alt="良好睡眠" />
			
			<h3>助眠小物推荐</h3>
			<ul>
				<li>😴 乳胶枕（支撑颈椎）</li>
				<li>😴 蒸汽眼罩（放松眼部）</li>
				<li>😴 白噪音机（遮蔽噪音）</li>
				<li>😴 薰衣草香囊（舒缓神经）</li>
			</ul>
			
			<blockquote>
				<p>好睡眠，好身体！坚持良好的睡眠习惯，相信你也能拥有高质量睡眠。</p>
			</blockquote>
		`,
		cover: 'https://picsum.photos/800/450?random=8',
		images: [],
		video: null,
		type: 'article',
		category: 'psychology',
		categoryName: '心理健康',
		tags: ['失眠', '睡眠', '助眠', '心理健康'],
		source: '心理健康',
		author: '林心理师',
		authorTitle: '心理咨询师',
		publishTime: '2024-01-12 10:00:00',
		viewCount: 14532,
		likeCount: 1123,
		commentCount: 267,
		isFavorite: false,
		isLiked: false
	}
]

// ==================== API 接口 ====================

/**
 * 获取新闻列表
 * @param {Object} params - 查询参数
 * @param {String} params.category - 分类ID（可选，默认'all'）
 * @param {String} params.keyword - 搜索关键词（可选）
 * @param {Number} params.page - 页码（默认1）
 * @param {Number} params.pageSize - 每页数量（默认10）
 * @returns {Promise}
 */
export function getNewsList(params = {}) {
	// TODO: 替换为真实API
	// return request.get('/news/list', params)
	
	// 模拟数据
	return new Promise((resolve) => {
		setTimeout(() => {
			const { category = 'all', keyword = '', page = 1, pageSize = 10 } = params
			
			// 筛选数据
			let filteredData = [...mockNewsData]
			
			// 分类筛选
			if (category && category !== 'all') {
				filteredData = filteredData.filter(item => item.category === category)
			}
			
			// 关键词搜索
			if (keyword) {
				const kw = keyword.toLowerCase()
				filteredData = filteredData.filter(item => 
					item.title.toLowerCase().includes(kw) || 
					item.summary.toLowerCase().includes(kw) ||
					item.tags.some(tag => tag.toLowerCase().includes(kw))
				)
			}
			
			// 分页
			const total = filteredData.length
			const start = (page - 1) * pageSize
			const end = start + pageSize
			const list = filteredData.slice(start, end)
			
			resolve({
				code: 200,
				message: 'success',
				data: {
					list,
					total,
					page,
					pageSize,
					hasMore: end < total
				}
			})
		}, 500) // 模拟网络延迟
	})
}

/**
 * 获取新闻详情
 * @param {Number} id - 新闻ID
 * @returns {Promise}
 */
export function getNewsDetail(id) {
	// TODO: 替换为真实API
	// return request.get(`/news/detail/${id}`)
	
	// 模拟数据
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const news = mockNewsData.find(item => item.id === id)
			
			if (news) {
				// 增加浏览量
				news.viewCount++
				
				resolve({
					code: 200,
					message: 'success',
					data: news
				})
			} else {
				reject({
					code: 404,
					message: '新闻不存在'
				})
			}
		}, 300)
	})
}

/**
 * 获取分类列表
 * @returns {Promise}
 */
export function getCategories() {
	// TODO: 替换为真实API
	// return request.get('/news/categories')
	
	return Promise.resolve({
		code: 200,
		message: 'success',
		data: mockCategories
	})
}

/**
 * 获取热门标签
 * @returns {Promise}
 */
export function getHotTags() {
	// TODO: 替换为真实API
	// return request.get('/news/tags/hot')
	
	return Promise.resolve({
		code: 200,
		message: 'success',
		data: mockHotTags
	})
}

/**
 * 切换收藏状态
 * @param {Number} id - 新闻ID
 * @returns {Promise}
 */
export function toggleFavorite(id) {
	// TODO: 替换为真实API
	// return request.post('/news/favorite/toggle', { id })
	
	return new Promise((resolve) => {
		setTimeout(() => {
			const news = mockNewsData.find(item => item.id === id)
			if (news) {
				news.isFavorite = !news.isFavorite
			}
			
			resolve({
				code: 200,
				message: 'success',
				data: {
					id,
					isFavorite: news?.isFavorite || false
				}
			})
		}, 200)
	})
}

/**
 * 切换点赞状态
 * @param {Number} id - 新闻ID
 * @returns {Promise}
 */
export function toggleLike(id) {
	// TODO: 替换为真实API
	// return request.post('/news/like/toggle', { id })
	
	return new Promise((resolve) => {
		setTimeout(() => {
			const news = mockNewsData.find(item => item.id === id)
			if (news) {
				news.isLiked = !news.isLiked
				news.likeCount += news.isLiked ? 1 : -1
			}
			
			resolve({
				code: 200,
				message: 'success',
				data: {
					id,
					isLiked: news?.isLiked || false,
					likeCount: news?.likeCount || 0
				}
			})
		}, 200)
	})
}

/**
 * 获取相关推荐
 * @param {Number} id - 当前新闻ID
 * @param {Number} limit - 推荐数量（默认3）
 * @returns {Promise}
 */
export function getRelatedNews(id, limit = 3) {
	// TODO: 替换为真实API
	// return request.get('/news/related', { id, limit })
	
	return new Promise((resolve) => {
		setTimeout(() => {
			const currentNews = mockNewsData.find(item => item.id === id)
			
			// 简单的推荐算法：同分类的其他文章
			let related = mockNewsData
				.filter(item => item.id !== id && item.category === currentNews?.category)
				.slice(0, limit)
			
			// 如果同分类文章不够，补充其他文章
			if (related.length < limit) {
				const more = mockNewsData
					.filter(item => item.id !== id && !related.includes(item))
					.slice(0, limit - related.length)
				related = [...related, ...more]
			}
			
			resolve({
				code: 200,
				message: 'success',
				data: related
			})
		}, 300)
	})
}

/**
 * 记录阅读历史
 * @param {Number} id - 新闻ID
 * @returns {Promise}
 */
export function recordReadHistory(id) {
	// TODO: 替换为真实API
	// return request.post('/news/history/record', { id })
	
	return Promise.resolve({
		code: 200,
		message: 'success'
	})
}

// 导出模拟数据（供测试使用）
export const mockData = {
	categories: mockCategories,
	hotTags: mockHotTags,
	newsList: mockNewsData
}

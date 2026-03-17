/**
 * UniApp APP-PLUS 环境兼容层
 * 必须在 node-forge / elliptic 加载之前执行
 *
 * 解决问题：node-forge 的 util.js 通过 process.versions.node / window / self
 * 三个分支确定 globalScope，APP-PLUS (V8) 环境三者均不存在，
 * 导致 globalScope = undefined → random.js 访问 globalScope.crypto 白屏崩溃
 */
;(function() {
	var g = typeof globalThis !== 'undefined' ? globalThis
		: typeof global !== 'undefined' ? global
		: typeof window !== 'undefined' ? window
		: {};

	// 确保 self 和 window 存在，覆盖 node-forge util.js 所有 globalScope 分支
	if (typeof g.self === 'undefined') g.self = g;
	if (typeof g.window === 'undefined') g.window = g;

	// 确保 crypto.getRandomValues 存在（node-forge random.js 需要）
	if (!g.crypto) {
		g.crypto = {
			getRandomValues: function(arr) {
				for (var i = 0; i < arr.length; i++) {
					arr[i] = Math.floor(Math.random() * 256);
				}
				return arr;
			}
		};
	}
})();

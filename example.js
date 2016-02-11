var iterator = require('./index')

iterator.test({
	brand: 'mt',
	environment: 'dev',
	match: function($, html) {
		return html.indexOf('2016_Maytag_VIBRATION_FREE_LIMITED GUARANTEE') > -1
	},
	models: [
		'MHW3100DW',
		'MHW4300DW',
		'MHW5100DW',
		'MHW5100DC',
		'MHW5400DW',
		'MHW5400DC',
		'MHW7100DW',
		'MHW7100DC',
		'MHW8100DW',
		'MHW8100DC',
		'MHW3500FW',
		'MHW5500FW',
		'MHW5500FC',
		'MHW8200FW',
		'MHW8200FC'
	],
	filename: 'results.json',
	callback: function(results) {
		console.log(results)
	}
})
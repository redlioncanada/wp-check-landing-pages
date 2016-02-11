var iterator = require('./index')

iterator.test({
	urls: [
		'http://www.whirlpool.ca/en_CA/Kitchen-1/Kitchen_Refrigeration-2/102280022/',
		'http://www.whirlpool.ca/en_CA/Laundry-1/102280045/',
		'http://www.whirlpool.ca/en_CA/Kitchen-1/Kitchen_Dishwasher__Cleaning-2/102280033/',
		'http://www.whirlpool.ca/en_CA/Kitchen-1/Kitchen_Cooking-2/102280002/'
	],
	callback: function(results) {
		console.log(results)
	}
})
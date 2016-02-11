'use strict'
var request = require('request')
var cheerio = require('cheerio')
var async = require('async')
var fs = require('fs')

class testIterator {
	constructor() {
		this.languages = {
			'en': '-300',
			'fr': '-301'
		}
	}

	test(opts) {
		if (!opts.models || typeof(opts.models) !== 'object' || !opts.models.length) throw new Error('Must specify a list of models!')
		if (!opts.url) {
			if (!opts.brand || !(opts.brand.toLowerCase() == 'wp' || opts.brand.toLowerCase() == 'mt' || opts.brand.toLowerCase() == 'ka')) throw new Error('Must specify a brand! ka, mt, or wp.')
			var prefix = opts.environment && opts.environment.toLowerCase() == 'dev' ? 'cuat' : 'www';
			switch(opts.brand.toLowerCase()) {
				case 'mt':
					opts.url = `http://${prefix}.maytag.ca/webapp/wcs/stores/servlet/WHRORNAjaxCatalogSearchView?storeId=10229&catalogId=10579&beginIndex=0&skipCache=true`
					break
				case 'ka':
					opts.url = `http://${prefix}.kitchenaid.ca/webapp/wcs/stores/servlet/WHRORNAjaxCatalogSearchView?storeId=10231&catalogId=10581&beginIndex=0&skipCache=true`
					break
				case 'wp':
					opts.url = `http://${prefix}.whirlpool.ca/webapp/wcs/stores/servlet/WHRORNAjaxCatalogSearchView?storeId=10228&catalogId=10578&beginIndex=0&skipCache=true`
					break
			}
			console.log(opts.url)
		}
		this.opts = opts
		var results = {}
		var self = this

		async.series([
			function(cb1) {
				//fetch each model's url
				var data = {}
				var cnt = 0

				async.each(opts.models, function(model, cb2) {
					results[model] = {}
					var completed = 0;

					for (var i in self.languages) {
						(function a(i) {
							request(opts.url+'&searchTerm='+model+'&langId='+self.languages[i], function(error, response, body) {
								console.log(opts.url+'&searchTerm='+model+'&langId='+self.languages[i])
								var data = {}
								if (!error && response.statusCode == 200) {
									if (self.searchReturnedResults(self, body)) {
										data.exists = true
										data.url = self.getModelLink(self, body)
									} else {
										data.exists = false
									}
								}

								if (!error) results[model][i] = data;
								if (++completed == Object.keys(self.languages).length) {
									cb2(error)
								}
							})
						})(i)
					}

				}, function(err) {
					cb1(err)
				})
			},
			function(cb1) {
				async.forEachOf(results, function(outer, key, cb2) {
					var completed = 0;
					for (var language in results[key]) {
						var model = results[key][language]

						if (!model.url) {
							if (++completed == Object.keys(self.languages).length) {
								cb2(false)
							}
						} else {
							(function a(language,model) {
								request(model.url+'?skipCache=true', function(error, response, body) {
									console.log(model.url)
									if (self.pageReturnedError(self, body)) {
										model = {exists: false}
									} else {
										if (self.productDiscontinued(self, body)) {
											model.discontinued = true
										} else {
											if (!error && response.statusCode == 200) {
												switch(typeof opts.match) {
													case 'string':
														if (opts.match in body) {
															model.test = 'passed'
														} else {
															model.test = 'failed'
														}
														break
													case 'function':
														var test = opts.match.call(self,cheerio.load(body), body)
														model.test = test ? 'passed' : 'failed'
														break
												}
											}
										}
									}

									if (!error) results[key][language] = model
									if (++completed == Object.keys(self.languages).length) {
										cb2(error)
									}
								})
							})(language,model)
						}
					}
				}, function(err) {
					cb1(err)
				})
			},
			function(cb1) {
				if (opts.filename && typeof(opts.filename) === 'string') self.save(opts.filename,results)
				if (self.opts.callback && typeof(self.opts.callback) === 'function') self.opts.callback.call(self,results)
				cb1()
			}
		])
	}

	productDiscontinued(self, body) {
		var $ = cheerio.load(body);
		return $('.inactive-product-details').length > 0;
	}

	pageReturnedError(self, body) {
		if (body.indexOf('The store has encountered a problem processing the last request. Try again later. If the problem persists, contact your site administrator.') > -1) return true
		return false
	}

	searchReturnedResults(self, body) {
		var $ = cheerio.load(body)
		
		switch(self.brand) {
			case "ka":
				return $('.product-link').length > 0
				break;
			default:
				return $('.applinceInfo_title').length > 0
		}
	}

	getModelLink(self, body) {
		var $ = cheerio.load(body)
		switch(self.brand) {
			case "ka":
				return $('.product_detail_set .product_row .product-link').first().attr('href')
				break;
			default:
				return $('.applince .applinceInfo_title a').first().attr('href')
		}
	}

	save(filename,results) {
		var self = this
		if (!filename) filename = 'output.json'
		if (results) {
			var out = {
				brand: self.opts.brand,
				date: new Date().toLocaleString(),
				results: results
			}

			var pretty = JSON.stringify(out, null, 4)
			fs.writeFile(filename, pretty, function(err) {
			})
		}
	}
}

module.exports = new testIterator();
'use strict'
var request = require('request')
var cheerio = require('cheerio')
var async = require('async')
var fs = require('fs')

//left off at getListingPages, gets listing page specific urls from each url supplied in opts

class testIterator {
	constructor() {
		this.languages = ['en', 'fr']
	}

	test(opts) {
		if (!opts.urls || typeof(opts.urls) !== 'object' || !opts.urls.length) throw new Error('Must specify a list of urls!')
		this.opts = opts
		var results = {}
		var self = this

		async.series([
			function(cb1) {
				//fetch each url
				var data = {}
				var cnt = 0

				async.each(opts.urls, function(url, cb2) {
					results[url] = {}
					var completed = 0;

					for (var i in self.languages) {
						var language = self.languages[i];
						var regex = new RegExp("\/("+self.languages.join('|')+")_CA\/", "g")

						url = url.replace(regex, "/"+language+"_CA/");
						console.log(url);
						(function a(url) {
							request(url, function(error, response, body) {

								if (!error && response.statusCode == 200) {
									results.url = self.getListingPageLinks(self, body)
								}

								if (++completed == Object.keys(self.languages).length) {
									cb2(error)
								}
							})
						})(url)
					}

				}, function(err) {

					cb1(err)
				})
			},
			function(cb1) {
				cb1();
				return;
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

	getListingPageLinks(self, body) {
		var $ = cheerio.load(body)
		var links = $('a').attr('href')
		console.log(links)
		var regex = new RegExp("\/[0-9]{9}", "g")

		for (var i = 0; i < links.length-1; i++) {
			var link = links[i]
			if (link.match(regex) == -1) links = links.splice(i,1), i--;
		}
		
		return links
	}

	productDiscontinued(self, body) {
		var $ = cheerio.load(body)
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
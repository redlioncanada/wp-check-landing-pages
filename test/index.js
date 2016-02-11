var assert = require('assert')
var testIterator = require('../index')
var opts = {
	brand: 'mt'
}

describe('testIterator', function() {
	describe('#test()', function() {
		it('should return exists as true', function(done) {
			var model = 'MDB4949SDM';
			opts.models = [model];
			opts.match = function() {return true;}
			opts.callback = function(results) {
				if (results[model].exists) done()
				else done(true)
			}
			testIterator.test(opts)
		})

		it('should return "passed" when a test passes', function(done) {
			var model = 'MDB4949SDM';
			opts.models = [model];
			opts.match = function() {return true;}
			opts.callback = function(results) {
				if (results[model].test && results[model].test == 'passed') done()
				else done(true)
			}
			testIterator.test(opts)
		})

		it('should return "failed" when a test fails', function(done) {
			var model = 'MDB4949SDM';
			opts.models = [model];
			opts.match = function() {return false;}
			opts.callback = function(results) {
				if (results[model].test && results[model].test == 'failed') done()
				else done(true)
			}
			testIterator.test(opts)
		})
	})
})


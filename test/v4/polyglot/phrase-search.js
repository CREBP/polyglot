var expect = require('chai').expect;
import polyglot from '../../../src';
describe('Translate search phrases (PubMed -> *)', ()=> {

	it('translate `"term1 term2"` -> PM `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'pubmed')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> OV `term1 term2`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'ovid')).to.equal('term1 term2');
	});

	it('translate `"term1 term2"` -> CO `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'cochrane')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> EM `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'embase')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> CI `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'cinahl')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> PY `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'psycinfo')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> SC `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'scopus')).to.equal('"term1 term2"');
	});

	it('translate `"term1 term2"` -> WS `"term1 term2"`', ()=> {
		expect(polyglot.translate('"term1 term2"', 'wos')).to.equal('"term1 term2"');
	});

});

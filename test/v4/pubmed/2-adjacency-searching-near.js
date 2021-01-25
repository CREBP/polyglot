var expect = require('chai').expect;
import polyglot from '../../../src';
describe('Translate search phrases (PubMed -> *)', ()=> {

	it('translate `AND` -> PM `AND`', ()=> {
		expect(polyglot.translate('AND', 'pubmed')).to.equal('AND');
	});

	it('translate `AND` -> OV `term1 term2`', ()=> {
		expect(polyglot.translate('AND', 'ovid')).to.equal('ADJ3');
	});

	it('translate `AND` -> CO `AND`', ()=> {
		expect(polyglot.translate('AND', 'cochrane')).to.equal('NEAR3');
	});

	it('translate `AND` -> EM `AND`', ()=> {
		expect(polyglot.translate('AND', 'embase')).to.equal('NEAR/3');
	});

	it('translate `AND` -> CI `AND`', ()=> {
		expect(polyglot.translate('AND', 'cinahl')).to.equal('N3');
	});

	it('translate `AND` -> WS `AND`', ()=> {
		expect(polyglot.translate('AND', 'wos')).to.equal('NEAR/3');
	});

	it('translate `AND` -> SC `AND`', ()=> {
		expect(polyglot.translate('AND', 'scopus')).to.equal('W/3');
	});

	it('translate `AND` -> PY `AND`', ()=> {
		expect(polyglot.translate('AND', 'psycinfo')).to.equal('ADJ3');
	});

	it('translate `AND` -> PQ `AND`', ()=> {
		expect(polyglot.translate('AND', 'proquest')).to.equal('NEAR/3');
	});

	it('translate `AND` -> SD `AND`', ()=> {
		expect(polyglot.translate('AND', 'sportdiscus')).to.equal('N/3');
	});

	it('translate `AND` -> IH `AND`', ()=> {
		expect(polyglot.translate('AND', 'informithealth')).to.equal('%');
	});

});

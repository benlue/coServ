const  ckin = require('../lib/uic/CheckIn');

describe("Input parameter verifier", function() {
    it("is an array", function() {
        expect(ckin.isArray([])).toBe( true );
    });

    it("is an array of string", function() {
        expect(ckin.isArray([123], ckin.isString)).toBe( false );
        expect(ckin.isArray(['123'], ckin.isString)).toBe( true );

        expect(ckin.isArray(['123', 53], ckin.isString)).toBe( false );
    });
});
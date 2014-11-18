(function() {

    var esprima = require('esprima'),
        escodegen = require('escodegen'),
        fs = require('fs'),
        sourceMapToAst = require('sourcemap-to-ast');

    function readFile(file) {
        return fs.readFileSync(file, {encoding: 'UTF-8'});
    }

    function stringifyMap(map) {
        return JSON.stringify(map, null, 2);
    }

    //////////

    var sourceA = readFile('./files/a.js');
    var sourceB = readFile('./files/b.js');

    var ast1 = esprima.parse(sourceA, {
        loc: true,
        source: 'a.js'
    });

    var ast2 = esprima.parse(sourceB, {
        loc: true,
        source: 'b.js'
    });

    var astMerge = {
        type: 'Program',
        body: [].concat(ast1.body).concat(ast2.body)
    };

    var output = escodegen.generate(astMerge, {
        sourceMap: true,
        sourceMapWithCode: true
    });

    var map = JSON.parse(output.map.toString());

    map.sourcesContent = [sourceA, sourceB]; // this is not done automatically, UglifyJS does it manually for example

    output.code += '\n//# sourceMappingURL=merge.js.map'; // this is not done automatically per Escodegen docs

    // This is basically what will be produced from RJS optimizer - one file, one sourcemap
    fs.writeFileSync('./files/merge.js', output.code);
    fs.writeFileSync('./files/merge.js.map', stringifyMap(map));

    //////////

    var astMerge2 = esprima.parse(output.code, {
        loc: true,
        source: 'merge.js'
    });

    sourceMapToAst(astMerge2, map); // without it sources section of the result map will point to "merge.js"

    // some manipulations may be performed here

    var output2 = escodegen.generate(astMerge2, {
        sourceMap: true,
        sourceMapWithCode: true
    });

    output2.code += '\n//# sourceMappingURL=merge2.js.map';

    fs.writeFileSync('./files/merge2.js', output2.code);
    fs.writeFileSync('./files/merge2.js.map', stringifyMap(JSON.parse(output2.map.toString())));

})();
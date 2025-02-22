function detectPackageType() {
    return new Promise((r, _) => {
        if (typeof exports === 'undefined') {
            console.log('not found exports -> esm');
            r('esm');
        } else {
            r('commonjs');
        }
    })
}

function loadFs(packageType) {
    if (packageType === 'esm') {
        return import('fs')
        .then((_fs) => {
            return _fs;
        })
    } else {
        const _fs = require('fs');
        return _fs;
    }
}

function main(fs) {
    const pkg =  JSON.parse(
        fs.readFileSync('./package.json').toString()
    )
    const { version } = pkg;
    pkg.version = `0.0.0`; 
    fs.writeFileSync('package.zero.json', JSON.stringify(pkg, null, 2));
    fs.writeFileSync('version.js', 
        `export const version = "${version}";
        if (module && module.exports) {
            module.exports.version = "${version}";
        }`
    );
}

detectPackageType()
    .then(loadFs)
    .then(main)
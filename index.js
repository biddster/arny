const AWS = require('aws-sdk');
const R = require('ramda');
const Promise = require('bluebird');
const path = require('path');
const requireAll = require('require-all');

AWS.config.update({
    region: 'eu-west-1',
    credentials: new AWS.SharedIniFileCredentials()
});

AWS.config.setPromisesDependency(Promise);

const apis = requireAll(path.join(__dirname, 'api'));

const outputFunc = R.compose(
    R.reject(R.isNil),
    R.flatten
);

async function callApi(account, region, listers, api) {
    try {
        const client = new AWS[api]({ region });
        const data = await Promise.all(
            R.map(async lister => {
                // TODO handle nextToken
                console.log(`${region}: ${api}`);
                const res = await client[lister.method](lister.params).promise();
                // console.log(data);
                let output;
                if (typeof lister.results === 'function') {
                    output = lister.results(account, region, res);
                } else {
                    output = res[lister.results];
                    if (lister.pluck) {
                        output = R.pluck(lister.pluck, output);
                    }
                }
                return R.map(arn => {
                    return `${account},${region},${api},${arn}`;
                }, output);
            }, listers)
        );
        const ret = outputFunc(data);
        // console.log(ret);
        return ret;
    } catch (e) {
        if (e.message && e.message.indexOf('Inaccessible host') >= 0) {
            console.error(e);
        } else {
            console.error(`${region} ${api} ${e.stack}`);
        }
        return null;
    }
}

async function loadRegion(account, region) {
    console.log(`Loading region [${region}]`);
    const fn = R.curry(callApi)(account, region);
    const mapped = R.mapObjIndexed(fn, apis);
    return Promise.all(R.values(mapped));
}

(async () => {
    try {
        const sts = new AWS.STS();
        const identity = await sts.getCallerIdentity({}).promise();
        const ec2 = new AWS.EC2();
        const data = await ec2.describeRegions({}).promise();
        const regions = R.pluck('RegionName', data.Regions);
        console.log(regions);
        let results = await Promise.all(R.map(R.curry(loadRegion)(identity.Account), regions));
        results = outputFunc(results);
        results.forEach(result => console.log(result));
    } catch (err) {
        console.error(err.stack);
    }
})();

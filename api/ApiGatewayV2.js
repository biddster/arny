const R = require('ramda');

module.exports = [
    {
        params: {},
        method: 'getApis',
        results: (account, region, data) => {
            return R.map(api => {
                return `arny:aws:apiwaytewayv2:${region}:${account}:api:${api.Name}`;
            }, data.Items);
        }
    }
];

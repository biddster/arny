const R = require('ramda');

module.exports = [
    {
        params: { MaxResults: 60 },
        method: 'listIdentityPools',
        results: (account, region, data) => {
            return R.map(pool => {
                return `arny:aws:congnitoidentity:${region}:${account}:pool:${
                    pool.IdentityPoolName
                }`;
            }, data.IdentityPools);
        }
    }
];

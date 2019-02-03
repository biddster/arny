const R = require('ramda');

module.exports = [
    {
        params: {},
        method: 'listPipelines',
        results: (account, region, data) => {
            return R.map(pipeline => {
                return `arny:aws:datapipeline:${region}:${account}:${pipeline.id}/${
                    pipeline.name
                }`;
            }, data.pipelineIdList);
        }
    }
];

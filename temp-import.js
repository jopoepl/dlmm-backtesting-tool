
const { logPoolData } = require('./src/lib/data/snapshotService.ts');
console.log(JSON.stringify({ success: true, logPoolData: logPoolData.toString() }));
  
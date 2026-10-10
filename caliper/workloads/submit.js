'use strict';

// Caliper workload: real submitComplaint transactions on the local Hardhat node.
// Sent through this.sutAdapter so Caliper counts every tx (earlier ethers-direct
// sends were invisible to Caliper and the round never ended - do NOT bypass).
// Single funded account (authority) sends; anyone may submit, proven by tests.
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class SubmitWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txCounter = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundLabel, loader, kvs) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundLabel, loader, kvs);
        this.txCounter = workerIndex * 100000;
    }

    async submitTransaction() {
        const n = this.txCounter;
        this.txCounter = this.txCounter + 1;
        const request = {
            contract: 'CivicChain',
            verb: 'submitComplaint',
            args: ['Caliper pothole report ' + n, 'Pothole', 'Caliper street']
        };
        await this.sutAdapter.sendRequests(request);
    }
}

function createWorkloadModule() {
    return new SubmitWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

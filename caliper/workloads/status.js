'use strict';

// Caliper workload: real updateStatus calls, Reported -> In Progress.
// Runs AFTER the submit rounds. Takes the newest complaints (all freshly
// Reported) counting backwards so reruns never touch an already-updated id.
// Sent through this.sutAdapter so Caliper counts every tx.
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class StatusWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.newestId = 0;
        this.slot = 0;
        this.workerCount = 1;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundLabel, loader, kvs) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundLabel, loader, kvs);
        this.slot = workerIndex;
        this.workerCount = totalWorkers;

        // Read-only call through the adapter: how many complaints exist?
        const status = await this.sutAdapter.sendRequests({
            contract: 'CivicChain',
            verb: 'getTotalComplaints',
            args: [],
            readOnly: true
        });
        this.newestId = Number(status.GetResult()) - 1;
    }

    async submitTransaction() {
        const id = this.newestId - this.slot;
        this.slot = this.slot + this.workerCount;
        const request = {
            contract: 'CivicChain',
            verb: 'updateStatus',
            args: [id, 1]
        };
        await this.sutAdapter.sendRequests(request);
    }
}

function createWorkloadModule() {
    return new StatusWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

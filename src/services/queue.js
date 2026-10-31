export class AsyncQueue {
    constructor(maxConcurrent = 1) {
        this.max = maxConcurrent;
        this.active = 0;
        this.pending = [];
    }

    run(task) {
        return new Promise((resolve, reject) => {
            this.pending.push({ task, resolve, reject });
            this.process();
        });
    }

    process() {
        while (this.active < this.max && this.pending.length > 0) {
            const { task, resolve, reject } = this.pending.shift();
            this.active += 1;
            Promise.resolve()
                .then(task)
                .then(resolve, reject)
                .finally(() => {
                    this.active -= 1;
                    this.process();
                });
        }
    }
}
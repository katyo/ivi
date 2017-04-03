import { unorderedArrayDelete } from "./utils";

export class RepeatableTaskList {
    tasks: Array<() => boolean | undefined>;

    constructor() {
        this.tasks = [];
    }

    add(task: () => boolean | undefined): void {
        this.tasks.push(task);
    }

    run(): void {
        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            if (task() === true) {
                unorderedArrayDelete(this.tasks, i);
            }
        }
    }
}

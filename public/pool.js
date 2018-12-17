"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Debug = require("debug");
var nextTick = require("next-tick");
var group_1 = require("../private/group");
var persistent_batch_1 = require("../private/persistent-batch");
var task_1 = require("../private/task");
var utils_1 = require("../private/utils");
var task_2 = require("./task");
var debug = Debug("promise-pool-executor:pool");
debug("booting %o", "promise-pool-executor");
var PromisePoolExecutor = /** @class */ (function () {
    /**
     * Construct a new PromisePoolExecutor object.
     * @param concurrencyLimit The maximum number of promises which are allowed to run at one time.
     */
    function PromisePoolExecutor(options) {
        /**
         * All tasks which are active or waiting.
         */
        this._tasks = [];
        var groupOptions;
        if (!utils_1.isNull(options)) {
            if (typeof options === "object") {
                groupOptions = options;
            }
            else {
                groupOptions = {
                    concurrencyLimit: options,
                };
            }
        }
        else {
            groupOptions = {};
        }
        this._globalGroup = this.addGroup(groupOptions);
    }
    Object.defineProperty(PromisePoolExecutor.prototype, "concurrencyLimit", {
        /**
         * The maximum number of promises allowed to be active simultaneously in the pool.
         */
        get: function () {
            return this._globalGroup.concurrencyLimit;
        },
        set: function (val) {
            this._globalGroup.concurrencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolExecutor.prototype, "frequencyLimit", {
        /**
         * The maximum number promises allowed to be generated within the time window specified by {frequencyWindow}.
         */
        get: function () {
            return this._globalGroup.frequencyLimit;
        },
        set: function (val) {
            this._globalGroup.frequencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolExecutor.prototype, "frequencyWindow", {
        /**
         * The time window in milliseconds to use for {frequencyLimit}.
         */
        get: function () {
            return this._globalGroup.frequencyWindow;
        },
        set: function (val) {
            this._globalGroup.frequencyWindow = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolExecutor.prototype, "activeTaskCount", {
        /**
         * The number of tasks active in the pool.
         */
        get: function () {
            return this._globalGroup.activeTaskCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolExecutor.prototype, "activePromiseCount", {
        /**
         * The number of promises active in the pool.
         */
        get: function () {
            return this._globalGroup.activePromiseCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolExecutor.prototype, "freeSlots", {
        /**
         * The number of promises which can be created before reaching the pool's configured limits.
         */
        get: function () {
            return this._globalGroup._concurrencyLimit - this._globalGroup._activePromiseCount;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Adds a group to the pool.
     */
    PromisePoolExecutor.prototype.addGroup = function (options) {
        var _this = this;
        return new group_1.PromisePoolGroupPrivate(this, function () { return _this._triggerNextTick(); }, options);
    };
    PromisePoolExecutor.prototype.addGenericTask = function (options) {
        var _this = this;
        var task = new task_1.PromisePoolTaskPrivate({
            detach: function () {
                _this._removeTask(task);
            },
            globalGroup: this._globalGroup,
            pool: this,
            triggerNowCallback: function () { return _this._triggerNow(); },
        }, options);
        if (task.state <= task_2.TaskState.Paused) {
            // Attach the task
            this._tasks.push(task);
        }
        this._triggerNow();
        return task;
    };
    /**
     * Adds a task with a single promise. The resulting task can be resolved to the result of this promise.
     */
    PromisePoolExecutor.prototype.addSingleTask = function (options) {
        var data = options.data;
        var generator = options.generator;
        return this.addGenericTask({
            generator: function () {
                return generator.call(this, data);
            },
            groups: options.groups,
            invocationLimit: 1,
            paused: options.paused,
            resultConverter: function (result) { return result[0]; },
        });
    };
    /**
     * Adds a task with a concurrency limit of 1. The resulting task can be resolved to an array containing the
     * results of the task.
     */
    PromisePoolExecutor.prototype.addLinearTask = function (options) {
        return this.addGenericTask({
            concurrencyLimit: 1,
            frequencyLimit: options.frequencyLimit,
            frequencyWindow: options.frequencyWindow,
            generator: options.generator,
            groups: options.groups,
            invocationLimit: options.invocationLimit,
            paused: options.paused,
        });
    };
    /**
     * Adds a task which generates a promise for batches of elements from an array. The resulting task can be
     * resolved to an array containing the results of the task.
     */
    PromisePoolExecutor.prototype.addBatchTask = function (options) {
        var index = 0;
        // Unacceptable values: NaN, <=0, type not number/function
        if (!options.batchSize || typeof options.batchSize !== "function"
            && (typeof options.batchSize !== "number" || options.batchSize <= 0)) {
            throw new Error("Invalid batch size: " + options.batchSize);
        }
        var data = options.data;
        var generator = options.generator;
        var batchSizeOption = options.batchSize;
        return this.addGenericTask({
            concurrencyLimit: options.concurrencyLimit,
            frequencyLimit: options.frequencyLimit,
            frequencyWindow: options.frequencyWindow,
            generator: function (invocation) {
                if (index >= data.length) {
                    return; // No data to process
                }
                var oldIndex = index;
                if (typeof batchSizeOption === "function") {
                    var batchSize = batchSizeOption(data.length - oldIndex, this.freeSlots);
                    // Unacceptable values: NaN, <=0, type not number
                    if (!batchSize || typeof batchSize !== "number" || batchSize <= 0) {
                        return Promise.reject(new Error("Invalid batch size: " + batchSize));
                    }
                    index += batchSize;
                }
                else {
                    index += batchSizeOption;
                }
                if (index >= data.length) {
                    this.end(); // last batch
                }
                return generator.call(this, data.slice(oldIndex, index), oldIndex, invocation);
            },
            groups: options.groups,
            invocationLimit: options.invocationLimit,
            paused: options.paused,
        });
    };
    /**
     * Adds a task which generates a promise for each element in an array. The resulting task can be resolved to
     * an array containing the results of the task.
     */
    PromisePoolExecutor.prototype.addEachTask = function (options) {
        var data = options.data;
        return this.addGenericTask({
            concurrencyLimit: options.concurrencyLimit,
            frequencyLimit: options.frequencyLimit,
            frequencyWindow: options.frequencyWindow,
            groups: options.groups,
            paused: options.paused,
            generator: function (index) {
                if (index >= data.length - 1) {
                    if (index >= data.length) {
                        return; // No element to process
                    }
                    // Last element
                    this.end();
                }
                return options.generator.call(this, data[index], index);
            },
        });
    };
    /**
     * Adds a task which can be used to combine multiple requests into batches to improve efficiency.
     */
    PromisePoolExecutor.prototype.addPersistentBatchTask = function (options) {
        return new persistent_batch_1.PersistentBatchTaskPrivate(this, options);
    };
    /**
     * Returns a promise which resolves when there are no more tasks queued to run.
     */
    PromisePoolExecutor.prototype.waitForIdle = function () {
        return this._globalGroup.waitForIdle();
    };
    PromisePoolExecutor.prototype._cleanFrequencyStarts = function () {
        // Remove the frequencyStarts entries which are outside of the window
        var now = Date.now();
        this._globalGroup._cleanFrequencyStarts(now);
        this._tasks.forEach(function (task) {
            task._cleanFrequencyStarts(now);
        });
    };
    PromisePoolExecutor.prototype._clearTriggerTimeout = function () {
        if (this._nextTriggerTimeout) {
            clearTimeout(this._nextTriggerTimeout);
            this._nextTriggerTimeout = undefined;
        }
        this._nextTriggerTime = undefined;
    };
    PromisePoolExecutor.prototype._triggerNextTick = function () {
        var _this = this;
        if (this._nextTriggerTime === -1) {
            return;
        }
        this._clearTriggerTimeout();
        this._nextTriggerTime = -1;
        nextTick(function () {
            if (_this._nextTriggerTime === -1) {
                _this._nextTriggerTime = undefined;
                _this._triggerNow();
            }
        });
    };
    /**
     * Private Method: Triggers promises to start.
     */
    PromisePoolExecutor.prototype._triggerNow = function () {
        var _this = this;
        if (this._triggering) {
            debug("Setting triggerAgain flag.");
            this._triggerAgain = true;
            return;
        }
        this._triggering = true;
        this._triggerAgain = false;
        debug("Trigger promises");
        this._cleanFrequencyStarts();
        this._clearTriggerTimeout();
        var taskIndex = 0;
        var task;
        var soonest = Infinity;
        var busyTime;
        while (taskIndex < this._tasks.length) {
            task = this._tasks[taskIndex];
            busyTime = task._busyTime();
            debug("BusyTime: %o", busyTime);
            if (!busyTime) {
                task._run();
            }
            else {
                taskIndex++;
                if (busyTime < soonest) {
                    soonest = busyTime;
                }
            }
        }
        this._triggering = false;
        if (this._triggerAgain) {
            return this._triggerNow();
        }
        var time;
        if (soonest !== Infinity) {
            time = Date.now();
            if (time >= soonest) {
                return this._triggerNow();
            }
            this._nextTriggerTime = soonest;
            this._nextTriggerTimeout = setTimeout(function () {
                _this._nextTriggerTimeout = undefined;
                _this._nextTriggerTime = 0;
                _this._triggerNow();
            }, soonest - time);
        }
    };
    PromisePoolExecutor.prototype._removeTask = function (task) {
        var i = this._tasks.indexOf(task);
        if (i !== -1) {
            debug("Task removed");
            this._tasks.splice(i, 1);
        }
    };
    return PromisePoolExecutor;
}());
exports.PromisePoolExecutor = PromisePoolExecutor;

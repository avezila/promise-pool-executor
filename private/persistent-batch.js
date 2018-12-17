"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defer = require("p-defer");
var promise_batcher_1 = require("promise-batcher");
var task_1 = require("../public/task");
var PersistentBatchTaskPrivate = /** @class */ (function () {
    function PersistentBatchTaskPrivate(pool, options) {
        var _this = this;
        var immediate;
        var delayDeferred;
        var taskDeferred;
        this._generator = options.generator;
        this._batcher = new promise_batcher_1.Batcher({
            batchingFunction: function (inputs) {
                if (!taskDeferred) {
                    throw new Error("Expected taskPromise to be set (internal error).");
                }
                var localTaskDeferred = taskDeferred;
                taskDeferred = undefined;
                var promise;
                try {
                    var result = _this._generator(inputs);
                    promise = result instanceof Promise ? result : Promise.resolve(result);
                }
                catch (err) {
                    promise = Promise.reject(err);
                }
                return promise.catch(function (err) {
                    // Do not send errors to the task, since they will be received via the getResult promises
                    localTaskDeferred.resolve();
                    throw err;
                }).then(function (outputs) {
                    localTaskDeferred.resolve();
                    return outputs;
                });
            },
            delayFunction: function () {
                if (delayDeferred) {
                    throw new Error("Expected delayDeferred not to be set (internal error).");
                }
                if (_this._task.state >= task_1.TaskState.Exhausted) {
                    throw new Error("This task has ended and cannot process more items");
                }
                immediate = false;
                _this._task.resume();
                if (immediate) {
                    if (immediate !== true) {
                        throw immediate;
                    }
                    return;
                }
                delayDeferred = defer();
                return delayDeferred.promise;
            },
            maxBatchSize: options.maxBatchSize,
            queuingDelay: options.queuingDelay,
            queuingThresholds: options.queuingThresholds,
        });
        this._task = pool.addGenericTask({
            concurrencyLimit: options.concurrencyLimit,
            frequencyLimit: options.frequencyLimit,
            frequencyWindow: options.frequencyWindow,
            generator: function () {
                _this._task.pause();
                if (taskDeferred) {
                    immediate = new Error("Expected taskDeferred not to be set (internal error).");
                    return;
                }
                taskDeferred = defer();
                if (delayDeferred) {
                    var localDelayDefered = delayDeferred;
                    delayDeferred = undefined;
                    localDelayDefered.resolve();
                }
                else {
                    immediate = true;
                }
                return taskDeferred.promise;
            },
            paused: true,
        });
    }
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "activePromiseCount", {
        get: function () {
            return this._task.activePromiseCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "concurrencyLimit", {
        get: function () {
            return this._task.concurrencyLimit;
        },
        set: function (val) {
            this._task.concurrencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "frequencyLimit", {
        get: function () {
            return this._task.frequencyLimit;
        },
        set: function (val) {
            this._task.frequencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "frequencyWindow", {
        get: function () {
            return this._task.frequencyWindow;
        },
        set: function (val) {
            this._task.frequencyWindow = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "freeSlots", {
        get: function () {
            return this._task.freeSlots;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PersistentBatchTaskPrivate.prototype, "state", {
        get: function () {
            return this._task.state;
        },
        enumerable: true,
        configurable: true
    });
    PersistentBatchTaskPrivate.prototype.getResult = function (input) {
        if (this._task.state >= task_1.TaskState.Exhausted) {
            return Promise.reject(new Error("This task has ended and cannot process more items"));
        }
        return this._batcher.getResult(input);
    };
    PersistentBatchTaskPrivate.prototype.send = function () {
        this._batcher.send();
    };
    PersistentBatchTaskPrivate.prototype.end = function () {
        this._task.end();
    };
    return PersistentBatchTaskPrivate;
}());
exports.PersistentBatchTaskPrivate = PersistentBatchTaskPrivate;

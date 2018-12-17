"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Debug = require("debug");
var defer = require("p-defer");
var task_1 = require("../public/task");
var utils_1 = require("./utils");
var debug = Debug("promise-pool-executor:task");
var GLOBAL_GROUP_INDEX = 0;
var PromisePoolTaskPrivate = /** @class */ (function () {
    function PromisePoolTaskPrivate(privateOptions, options) {
        var _a;
        var _this = this;
        this._invocations = 0;
        this._invocationLimit = Infinity;
        this._result = [];
        this._deferreds = [];
        debug("Creating task");
        this._pool = privateOptions.pool;
        this._triggerCallback = privateOptions.triggerNowCallback;
        this._detachCallback = privateOptions.detach;
        this._resultConverter = options.resultConverter;
        this._state = options.paused ? task_1.TaskState.Paused : task_1.TaskState.Active;
        if (!utils_1.isNull(options.invocationLimit)) {
            if (typeof options.invocationLimit !== "number") {
                throw new Error("Invalid invocation limit: " + options.invocationLimit);
            }
            this._invocationLimit = options.invocationLimit;
        }
        // Create a group exclusively for this task. This may throw errors.
        this._taskGroup = privateOptions.pool.addGroup(options);
        this._groups = [privateOptions.globalGroup, this._taskGroup];
        if (options.groups) {
            var groups = options.groups;
            groups.forEach(function (group) {
                if (group._pool !== _this._pool) {
                    throw new Error("options.groups contains a group belonging to a different pool");
                }
            });
            (_a = this._groups).push.apply(_a, groups);
        }
        this._generator = options.generator;
        // Resolve the promise only after all options have been validated
        if (!utils_1.isNull(options.invocationLimit) && options.invocationLimit <= 0) {
            this.end();
            return;
        }
        this._groups.forEach(function (group) {
            group._incrementTasks();
        });
        // The creator will trigger the promises to run
    }
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "activePromiseCount", {
        get: function () {
            return this._taskGroup._activePromiseCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "invocations", {
        get: function () {
            return this._invocations;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "invocationLimit", {
        get: function () {
            return this._invocationLimit;
        },
        set: function (val) {
            if (utils_1.isNull(val)) {
                this._invocationLimit = Infinity;
            }
            else if (!isNaN(val) && typeof val === "number" && val >= 0) {
                this._invocationLimit = val;
                if (this._invocations >= this._invocationLimit) {
                    this.end();
                }
            }
            else {
                throw new Error("Invalid invocation limit: " + val);
            }
            if (this._triggerCallback) {
                this._triggerCallback();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "concurrencyLimit", {
        get: function () {
            return this._taskGroup.concurrencyLimit;
        },
        set: function (val) {
            this._taskGroup.concurrencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "frequencyLimit", {
        get: function () {
            return this._taskGroup.frequencyLimit;
        },
        set: function (val) {
            this._taskGroup.frequencyLimit = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "frequencyWindow", {
        get: function () {
            return this._taskGroup.frequencyWindow;
        },
        set: function (val) {
            this._taskGroup.frequencyWindow = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "freeSlots", {
        get: function () {
            var freeSlots = this._invocationLimit - this._invocations;
            this._groups.forEach(function (group) {
                var slots = group.freeSlots;
                if (slots < freeSlots) {
                    freeSlots = slots;
                }
            });
            return freeSlots;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolTaskPrivate.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns a promise which resolves when the task completes.
     */
    PromisePoolTaskPrivate.prototype.promise = function () {
        if (this._rejection) {
            if (this._rejection.promise) {
                // First handling of this rejection. Return the unhandled promise.
                var promise = this._rejection.promise;
                this._rejection.promise = undefined;
                return promise;
            }
            return Promise.reject(this._rejection.error);
        }
        else if (this._state === task_1.TaskState.Terminated) {
            return Promise.resolve(this._returnResult);
        }
        var deferred = defer();
        this._deferreds.push(deferred);
        return deferred.promise;
    };
    /**
     * Pauses an active task, preventing any additional promises from being generated.
     */
    PromisePoolTaskPrivate.prototype.pause = function () {
        if (this._state === task_1.TaskState.Active) {
            debug("State: %o", "Paused");
            this._state = task_1.TaskState.Paused;
        }
    };
    /**
     * Resumes a paused task, allowing for the generation of additional promises.
     */
    PromisePoolTaskPrivate.prototype.resume = function () {
        if (this._state === task_1.TaskState.Paused) {
            debug("State: %o", "Active");
            this._state = task_1.TaskState.Active;
            this._triggerCallback();
        }
    };
    /**
     * Ends the task. Any promises created by the promise() method will be resolved when all outstanding promises
     * have ended.
     */
    PromisePoolTaskPrivate.prototype.end = function () {
        // Note that this does not trigger more tasks to run. It can resolve a task though.
        if (this._state < task_1.TaskState.Exhausted) {
            debug("State: %o", "Exhausted");
            this._state = task_1.TaskState.Exhausted;
            if (this._taskGroup._activeTaskCount > 0) {
                this._detachCallback();
            }
        }
        if (!this._generating && this._state < task_1.TaskState.Terminated && this._taskGroup._activePromiseCount <= 0) {
            debug("State: %o", "Terminated");
            this._state = task_1.TaskState.Terminated;
            if (this._taskGroup._activeTaskCount > 0) {
                this._groups.forEach(function (group) {
                    group._decrementTasks();
                });
            }
            this._resolve();
        }
    };
    /**
     * Private. Returns 0 if the task is ready, Infinity if the task is busy with an indeterminate ready time, or the
     * timestamp for when the task will be ready.
     */
    PromisePoolTaskPrivate.prototype._busyTime = function () {
        if (this._state !== task_1.TaskState.Active) {
            return Infinity;
        }
        var time = 0;
        for (var _i = 0, _a = this._groups; _i < _a.length; _i++) {
            var group = _a[_i];
            var busyTime = group._busyTime();
            if (busyTime > time) {
                time = busyTime;
            }
        }
        return time;
    };
    PromisePoolTaskPrivate.prototype._cleanFrequencyStarts = function (now) {
        this._groups.forEach(function (group, index) {
            if (index > GLOBAL_GROUP_INDEX) {
                group._cleanFrequencyStarts(now);
            }
        });
    };
    /**
     * Private. Invokes the task.
     */
    PromisePoolTaskPrivate.prototype._run = function () {
        var _this = this;
        if (this._generating) {
            // This should never happen
            throw new Error("Internal Error: Task is already being run");
        }
        if (this._invocations >= this._invocationLimit) {
            // TODO: Make a test for this
            // This may detach / resolve the task if no promises are active
            this.end();
            return;
        }
        debug("Running generator");
        var promise;
        this._generating = true; // prevent task termination
        try {
            promise = this._generator.call(this, this._invocations);
        }
        catch (err) {
            this._generating = false;
            this._reject(err);
            return;
        }
        this._generating = false;
        if (utils_1.isNull(promise)) {
            if (this._state !== task_1.TaskState.Paused) {
                this.end();
            }
            // Remove the task if needed and start the next task
            return;
        }
        if (!(promise instanceof Promise)) {
            // In case what is returned is not a promise, make it one
            promise = Promise.resolve(promise);
        }
        this._groups.forEach(function (group) {
            group._activePromiseCount++;
            if (group._frequencyLimit !== Infinity) {
                group._frequencyStarts.push(Date.now());
            }
        });
        var resultIndex = this._invocations;
        this._invocations++;
        if (this._invocations >= this._invocationLimit) {
            // this will not detach the task since there are active promises
            this.end();
        }
        promise.catch(function (err) {
            _this._reject(err);
            // Resolve
        }).then(function (result) {
            debug("Promise ended.");
            _this._groups.forEach(function (group) {
                group._activePromiseCount--;
            });
            debug("Promise Count: %o", _this._taskGroup._activePromiseCount);
            // Avoid storing the result if it is undefined.
            // Some tasks may have countless iterations and never return anything, so this could eat memory.
            if (result !== undefined && _this._result) {
                _this._result[resultIndex] = result;
            }
            if (_this._state >= task_1.TaskState.Exhausted && _this._taskGroup._activePromiseCount <= 0) {
                _this.end();
            }
            // Remove the task if needed and start the next task
            _this._triggerCallback();
        });
    };
    /**
     * Private. Resolves the task if possible. Should only be called by end()
     */
    PromisePoolTaskPrivate.prototype._resolve = function () {
        var _this = this;
        if (this._rejection || !this._result) {
            return;
        }
        // Set the length of the resulting array in case some undefined results affected this
        this._result.length = this._invocations;
        this._state = task_1.TaskState.Terminated;
        if (this._resultConverter) {
            try {
                this._returnResult = this._resultConverter(this._result);
            }
            catch (err) {
                this._reject(err);
                return;
            }
        }
        else {
            this._returnResult = this._result;
        }
        // discard the original array to free memory
        this._result = undefined;
        if (this._deferreds.length) {
            this._deferreds.forEach(function (deferred) {
                deferred.resolve(_this._returnResult);
            });
            this._deferreds.length = 0;
        }
    };
    PromisePoolTaskPrivate.prototype._reject = function (err) {
        // Check if the task has already failed
        if (this._rejection) {
            debug("This task already failed. Redundant error: %O", err);
            return;
        }
        var taskError = {
            error: err,
        };
        this._rejection = taskError;
        var handled = false;
        // This may detach the task
        this.end();
        if (this._deferreds.length) {
            handled = true;
            this._deferreds.forEach(function (deferred) {
                deferred.reject(taskError.error);
            });
            this._deferreds.length = 0;
        }
        this._groups.forEach(function (group) {
            if (group._reject(taskError)) {
                handled = true;
            }
        });
        if (!handled) {
            // Create an unhandled rejection which may be handled later
            taskError.promise = Promise.reject(err);
        }
    };
    return PromisePoolTaskPrivate;
}());
exports.PromisePoolTaskPrivate = PromisePoolTaskPrivate;

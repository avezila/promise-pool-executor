"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defer = require("p-defer");
var utils_1 = require("./utils");
/** Internal use only */
var PromisePoolGroupPrivate = /** @class */ (function () {
    function PromisePoolGroupPrivate(pool, triggerNextCallback, options) {
        this._frequencyStarts = [];
        this._activeTaskCount = 0;
        this._activePromiseCount = 0;
        this._deferreds = [];
        /**
         * This flag prevents a rejection from being removed before nextTick is called.
         * This way, you can be certain that when calling waitForIdle after adding a task, the error will get handled.
         */
        this._recentRejection = false;
        /**
         * This flag indicates whether the rejection was handled by this group. This is used to flag subsequent rejections
         * within the group as handled.
         */
        this._locallyHandled = false;
        /**
         * Contains any additional rejections so they can be flagged as handled before the nextTick fires if applicable
         */
        this._secondaryRejections = [];
        this._pool = pool;
        if (!options) {
            options = {};
        }
        // Throw errors if applicable
        this.concurrencyLimit = options.concurrencyLimit;
        this.frequencyLimit = options.frequencyLimit;
        this.frequencyWindow = options.frequencyWindow;
        // Set the callback afterwards so it does not get triggered during creation
        this._triggerNextCallback = triggerNextCallback;
    }
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "activeTaskCount", {
        get: function () {
            return this._activeTaskCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "activePromiseCount", {
        get: function () {
            return this._activePromiseCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "concurrencyLimit", {
        get: function () {
            return this._concurrencyLimit;
        },
        set: function (val) {
            if (utils_1.isNull(val)) {
                this._concurrencyLimit = Infinity;
            }
            else if (val && typeof val === "number" && val > 0) {
                this._concurrencyLimit = val;
            }
            else {
                throw new Error("Invalid concurrency limit: " + val);
            }
            if (this._triggerNextCallback) {
                this._triggerNextCallback();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "frequencyLimit", {
        get: function () {
            return this._frequencyLimit;
        },
        set: function (val) {
            if (utils_1.isNull(val)) {
                this._frequencyLimit = Infinity;
            }
            else if (val && typeof val === "number" && val > 0) {
                this._frequencyLimit = val;
            }
            else {
                throw new Error("Invalid frequency limit: " + val);
            }
            if (this._triggerNextCallback) {
                this._triggerNextCallback();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "frequencyWindow", {
        get: function () {
            return this._frequencyWindow;
        },
        set: function (val) {
            if (utils_1.isNull(val)) {
                this._frequencyWindow = 1000;
            }
            else if (val && typeof val === "number" && val > 0) {
                this._frequencyWindow = val;
            }
            else {
                throw new Error("Invalid frequency window: " + val);
            }
            if (this._triggerNextCallback) {
                this._triggerNextCallback();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromisePoolGroupPrivate.prototype, "freeSlots", {
        get: function () {
            if (this._frequencyLimit !== Infinity) {
                this._cleanFrequencyStarts(Date.now());
            }
            return this._getFreeSlots();
        },
        enumerable: true,
        configurable: true
    });
    PromisePoolGroupPrivate.prototype._getFreeSlots = function () {
        return Math.min(this._concurrencyLimit - this._activePromiseCount, this._frequencyLimit - this._frequencyStarts.length);
    };
    /**
     * Cleans out old entries from the frequencyStarts array. Uses a passed timestamp to ensure consistency between
     * groups.
     */
    PromisePoolGroupPrivate.prototype._cleanFrequencyStarts = function (now) {
        // Remove the frequencyStarts entries which are outside of the window
        if (this._frequencyStarts.length > 0) {
            var time = now - this._frequencyWindow;
            var i = 0;
            while (i < this._frequencyStarts.length && this._frequencyStarts[i] <= time) {
                i++;
            }
            if (i > 0) {
                this._frequencyStarts.splice(0, i);
            }
        }
    };
    /**
     * Returns 0 if the group is available, Infinity if the group is busy for an indeterminate time, or the timestamp
     * of when the group will become available.
     */
    PromisePoolGroupPrivate.prototype._busyTime = function () {
        if (this._activePromiseCount >= this._concurrencyLimit) {
            return Infinity;
        }
        else if (this._frequencyLimit && this._frequencyStarts.length >= this._frequencyLimit) {
            return this._frequencyStarts[0] + this._frequencyWindow;
        }
        return 0;
    };
    /**
     * Resolves all pending waitForIdle promises.
     */
    PromisePoolGroupPrivate.prototype._resolve = function () {
        if (!this._rejection && this._deferreds.length) {
            this._deferreds.forEach(function (deferred) {
                deferred.resolve();
            });
            this._deferreds.length = 0;
        }
    };
    /**
     * Rejects all pending waitForIdle promises using the provided error.
     */
    PromisePoolGroupPrivate.prototype._reject = function (err) {
        var _this = this;
        if (this._rejection) {
            if (this._locallyHandled) {
                return true;
            }
            this._secondaryRejections.push(err);
            return false;
        }
        var handled = false;
        this._rejection = err;
        if (this._deferreds.length) {
            handled = true;
            this._locallyHandled = true;
            this._deferreds.forEach(function (deferred) {
                deferred.reject(err.error);
            });
            this._deferreds.length = 0;
        }
        this._recentRejection = true;
        // The group error state should reset on the next tick
        process.nextTick(function () {
            _this._recentRejection = false;
            if (_this._activeTaskCount < 1) {
                _this._rejection = undefined;
                _this._locallyHandled = false;
                if (_this._secondaryRejections.length) {
                    _this._secondaryRejections.length = 0;
                }
            }
        });
        return handled;
    };
    /**
     * Returns a promise which resolves when the group becomes idle.
     */
    PromisePoolGroupPrivate.prototype.waitForIdle = function () {
        if (this._rejection) {
            this._locallyHandled = true;
            if (this._secondaryRejections.length) {
                this._secondaryRejections.forEach(function (rejection) {
                    if (rejection.promise) {
                        rejection.promise.catch(function () {
                            // handle the rejection
                        });
                        rejection.promise = undefined;
                    }
                });
                this._secondaryRejections.length = 0;
            }
            if (this._rejection.promise) {
                var promise = this._rejection.promise;
                this._rejection.promise = undefined;
                return promise;
            }
            return Promise.reject(this._rejection.error);
        }
        if (this._activeTaskCount <= 0) {
            return Promise.resolve();
        }
        var deferred = defer();
        this._deferreds.push(deferred);
        return deferred.promise;
    };
    PromisePoolGroupPrivate.prototype._incrementTasks = function () {
        this._activeTaskCount++;
    };
    /**
     * Decrements the active tasks, resolving promises if applicable.
     */
    PromisePoolGroupPrivate.prototype._decrementTasks = function () {
        this._activeTaskCount--;
        if (this._activeTaskCount > 0) {
            return;
        }
        if (this._rejection && !this._recentRejection) {
            this._rejection = undefined;
            this._locallyHandled = false;
        }
        else {
            this._resolve();
        }
    };
    return PromisePoolGroupPrivate;
}());
exports.PromisePoolGroupPrivate = PromisePoolGroupPrivate;

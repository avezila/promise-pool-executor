"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var chai_1 = require("chai");
var chaiAsPromised = require("chai-as-promised");
var Debug = require("debug");
var Pool = require("../index");
var debug = Debug("promise-pool-executor:test");
chai.use(chaiAsPromised);
// Verify that the types needed can be imported
var typingImportTest = undefined;
if (typingImportTest) {
    // satisfy TypeScript's need to use the variable
}
/**
 * Milliseconds per tick.
 */
var tick = 100;
/**
 * Milliseconds tolerance for tests above the target.
 */
var tolerance = 80;
/**
 * Returns a promise which waits the specified amount of time before resolving.
 */
function wait(time) {
    if (time <= 0) {
        return Promise.resolve();
    }
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, time);
    });
}
/**
 * Expects an array of result times (ms) to be within the tolerance range of the specified numbers of target ticks.
 */
function expectTimes(resultTimes, targetTicks, message) {
    chai_1.expect(resultTimes).to.have.lengthOf(targetTicks.length, message);
    resultTimes.forEach(function (val, i) {
        chai_1.expect(val).to.be.within(targetTicks[i] * tick - 1, targetTicks[i] * tick + tolerance, message + " (" + i + ")");
    });
}
function waitForUnhandledRejection(delay) {
    if (delay === void 0) { delay = tick * 2; }
    process.removeListener("unhandledRejection", unhandledRejectionListener);
    return new Promise(function (resolve, reject) {
        var timeout = setTimeout(function () {
            resetUnhandledRejectionListener();
            resolve();
        }, delay);
        process.prependOnceListener("unhandledRejection", function (err) {
            clearTimeout(timeout);
            debug("Caught unhandledRejection");
            resetUnhandledRejectionListener();
            reject(err);
        });
    });
}
function expectHandledRejection(delay) {
    if (delay === void 0) { delay = tick * 2; }
    return new Promise(function (resolve, reject) {
        var timeout = setTimeout(function () {
            resetHandledRejectionListener();
            reject(new Error("Rejection Not Handled"));
        }, delay);
        process.removeAllListeners("rejectionHandled");
        process.prependOnceListener("rejectionHandled", function () {
            clearTimeout(timeout);
            debug("rejectionHandled");
            resetHandledRejectionListener();
            resolve();
        });
    });
}
/**
 * Expects an unhandled promise rejection.
 * @param expectedError The error expected to be received with the rejection (optional).
 */
function expectUnhandledRejection(expectedError, delay) {
    if (delay === void 0) { delay = tick * 2; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chai_1.expect(waitForUnhandledRejection(delay)).to.be.rejectedWith(expectedError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Returns the sum of an array of numbers.
 */
function sum(nums) {
    var total = 0;
    var i;
    for (var _i = 0, nums_1 = nums; _i < nums_1.length; _i++) {
        i = nums_1[_i];
        total += i;
    }
    return total;
}
function unhandledRejectionListener(err) {
    debug("unhandledRejectionListener: %O", err);
    // Fail the test
    throw err;
}
function rejectionHandledListener() {
    debug("Unexpected rejectionHandled event");
    // Fail the test
    throw new Error("Unexpected rejectionHandled event");
}
function resetUnhandledRejectionListener() {
    process.removeAllListeners("unhandledRejection");
    process.addListener("unhandledRejection", unhandledRejectionListener);
}
function resetHandledRejectionListener() {
    process.removeAllListeners("rejectionHandled");
    process.addListener("rejectionHandled", rejectionHandledListener);
}
beforeEach(function () {
    resetUnhandledRejectionListener();
    resetHandledRejectionListener();
});
describe("Concurrency", function () {
    it("No Limit", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        return pool.addGenericTask({
            generator: function () {
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [1, 1, 1], "Timing Results");
        });
    });
    it("Global Limit", function () {
        var pool = new Pool.PromisePoolExecutor(2);
        var start = Date.now();
        return pool.addGenericTask({
            generator: function () {
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [1, 1, 2], "Timing Results");
        });
    });
    it("Task Limit", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        return pool.addGenericTask({
            concurrencyLimit: 2,
            generator: function () {
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [1, 1, 2], "Timing Results");
        });
    });
    it("Group Limit", function () {
        var pool = new Pool.PromisePoolExecutor();
        var group = pool.addGroup({
            concurrencyLimit: 2,
        });
        var start = Date.now();
        return pool.addGenericTask({
            generator: function () {
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            groups: [group],
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [1, 1, 2], "Timing Results");
        });
    });
});
describe("Frequency", function () {
    describe("Global Limit", function () {
        it("Steady Work", function () {
            var pool = new Pool.PromisePoolExecutor({
                frequencyLimit: 2,
                frequencyWindow: tick,
            });
            var start = Date.now();
            return pool.addGenericTask({
                generator: function () {
                    return Promise.resolve(Date.now() - start);
                },
                invocationLimit: 3,
            }).promise().then(function (results) {
                expectTimes(results, [0, 0, 1], "Timing Results");
            });
        });
        it("Offset Calls", function () {
            var pool = new Pool.PromisePoolExecutor({
                concurrencyLimit: 1,
                frequencyLimit: 2,
                frequencyWindow: tick * 3,
            });
            var start = Date.now();
            return pool.addGenericTask({
                generator: function () {
                    return wait(tick).then(function () { return Date.now() - start; });
                },
                invocationLimit: 4,
            }).promise().then(function (results) {
                expectTimes(results, [1, 2, 4, 5], "Timing Results");
            });
        });
        it("Work Gap", function () {
            var pool = new Pool.PromisePoolExecutor({
                frequencyLimit: 2,
                frequencyWindow: tick,
            });
            var start = Date.now();
            return pool.addGenericTask({
                generator: function () {
                    return Promise.resolve(Date.now() - start);
                },
                invocationLimit: 3,
            }).promise().then(function (results) {
                debug(results);
                expectTimes(results, [0, 0, 1], "Timing Results 1");
                return wait(tick * 2);
            }).then(function () {
                return pool.addGenericTask({
                    generator: function () {
                        return Promise.resolve(Date.now() - start);
                    },
                    invocationLimit: 3,
                }).promise();
            }).then(function (results) {
                debug(results);
                expectTimes(results, [3, 3, 4], "Timing Results 2");
            });
        });
    });
    it("Group Limit", function () {
        var pool = new Pool.PromisePoolExecutor();
        var group = pool.addGroup({
            frequencyLimit: 2,
            frequencyWindow: tick,
        });
        var start = Date.now();
        return pool.addGenericTask({
            generator: function () {
                return Promise.resolve(Date.now() - start);
            },
            groups: [group],
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [0, 0, 1], "Timing Results");
            chai_1.expect(group._frequencyStarts).to.have.length.of.at.least(1);
        });
    });
    it("Should Not Collect Timestamps If Not Set", function () {
        var pool = new Pool.PromisePoolExecutor();
        return pool.addGenericTask({
            generator: function () { return Promise.resolve(); },
            invocationLimit: 1,
        }).promise().then(function () {
            chai_1.expect(pool._globalGroup._frequencyStarts).to.have.lengthOf(0);
        });
    });
});
describe("Exception Handling", function () {
    it("Generator Function (synchronous)", function () {
        var pool = new Pool.PromisePoolExecutor();
        var error = new Error();
        return chai_1.expect(pool.addGenericTask({
            generator: function () {
                throw error;
            },
        }).promise()).to.be.rejectedWith(error);
    });
    it("Promise Rejection", function () {
        var pool = new Pool.PromisePoolExecutor();
        var error = new Error();
        return chai_1.expect(pool.addGenericTask({
            generator: function () {
                return wait(1).then(function () {
                    throw error;
                });
            },
            invocationLimit: 1,
        }).promise()).to.be.rejectedWith(error);
    });
    it("Multi-rejection", function () {
        var pool = new Pool.PromisePoolExecutor();
        var errors = [new Error("First"), new Error("Second")];
        return chai_1.expect(pool.addGenericTask({
            generator: function (i) {
                return wait(i ? tick : 1).then(function () {
                    throw errors[i];
                });
            },
            invocationLimit: 2,
        }).promise()).to.be.rejectedWith(errors[0])
            // Wait to ensure that the second rejection happens within the scope of this test without issue
            .then(function () { return wait(tick * 2); });
    });
    describe("Invalid Configuration", function () {
        it("Invalid Parameters", function () {
            var pool = new Pool.PromisePoolExecutor();
            chai_1.expect(function () { return pool.addGenericTask({
                concurrencyLimit: 0,
                generator: function () {
                    return Promise.resolve();
                },
            }); }).to.throw();
        });
        it("Group From Another Pool", function () {
            var pool1 = new Pool.PromisePoolExecutor();
            var pool2 = new Pool.PromisePoolExecutor();
            chai_1.expect(function () { return pool1.addGenericTask({
                generator: function () {
                    return Promise.resolve();
                },
                groups: [pool2.addGroup({
                        concurrencyLimit: 1,
                    })],
            }); }).to.throw();
        });
    });
    describe("Unhandled Rejection", function () {
        it("Generator Function (synchronous)", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            pool.addGenericTask({
                generator: function () {
                    throw error;
                },
                invocationLimit: 1,
            });
            return expectUnhandledRejection(error);
        });
        it("Promise Rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            pool.addGenericTask({
                generator: function () {
                    return wait(1).then(function () {
                        throw error;
                    });
                },
                invocationLimit: 1,
            });
            return expectUnhandledRejection(error);
        });
        it("Late Rejection Handling", function () { return __awaiter(_this, void 0, void 0, function () {
            var pool, error, task;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pool = new Pool.PromisePoolExecutor();
                        error = new Error();
                        task = pool.addGenericTask({
                            generator: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, wait(1)];
                                        case 1:
                                            _a.sent();
                                            throw error;
                                    }
                                });
                            }); },
                            invocationLimit: 1,
                        });
                        return [4 /*yield*/, expectUnhandledRejection(error)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Promise.all([
                                expectHandledRejection(),
                                task.promise().catch(function () {
                                    // discard the error
                                }),
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("Multi-rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var errors = [new Error("first"), new Error("second")];
            errors.forEach(function (err, i) {
                // Create a task which fails without the test handling the error
                pool.addGenericTask({
                    generator: function () {
                        return wait(i ? tick : 1).then(function () {
                            throw err;
                        });
                    },
                    invocationLimit: 1,
                });
            });
            return expectUnhandledRejection(errors[0])
                .then(function () { return expectUnhandledRejection(errors[1]); });
        });
        // This scenario creates two tasks at the same time
        // The first task rejects but is handled, while the second remains unhandled.
        it("Handled Rejection Followed By Unhandled Rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var errors = [new Error("first"), new Error("second")];
            // Create a task which will reject later without being handled
            pool.addGenericTask({
                generator: function () {
                    return wait(tick).then(function () { return Promise.reject(errors[1]); });
                },
                invocationLimit: 1,
            });
            return chai_1.expect(pool.addGenericTask({
                generator: function () {
                    return wait(1).then(function () { return Promise.reject(errors[0]); });
                },
                invocationLimit: 1,
            }).promise()).to.be.rejectedWith(errors[0]).then(function () {
                return expectUnhandledRejection(errors[1]);
            });
        });
        it("Unhandled Followed By Rejection With pool.waitForIdle", function () {
            var pool = new Pool.PromisePoolExecutor();
            var errors = [new Error("first"), new Error("second")];
            pool.addGenericTask({
                generator: function () { return Promise.reject(errors[0]); },
                invocationLimit: 1,
            });
            // Keep the global group busy so the error will not clear
            pool.addGenericTask({
                generator: function () { return wait(tick); },
                invocationLimit: 1,
            });
            return expectUnhandledRejection(errors[0])
                .then(function () {
                pool.addGenericTask({
                    generator: function () {
                        throw errors[1];
                    },
                    invocationLimit: 1,
                });
                return Promise.all([
                    expectHandledRejection(),
                    chai_1.expect(pool.waitForIdle()).to.be.rejectedWith(errors[0]),
                ]);
                // Wait to ensure the task does not throw an unhandled rejection
            }).then(function () { return wait(tick); });
        });
    });
    describe("pool.waitForIdle", function () {
        it("Generator Function (synchronous)", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            pool.addGenericTask({
                generator: function () {
                    throw error;
                },
                invocationLimit: 1,
            });
            return chai_1.expect(pool.waitForIdle()).to.be.rejectedWith(error);
        });
        it("Promise Rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            pool.addGenericTask({
                generator: function () {
                    return wait(1).then(function () {
                        throw error;
                    });
                },
                invocationLimit: 1,
            });
            return chai_1.expect(pool.waitForIdle()).to.be.rejectedWith(error);
        });
        // In this scenario, a child task fails after its parent does. In this case, only the first error should
        // be received, and the second should be handled by the pool.
        it("Child Task Rejection Shadowed By Parent Rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error("Parent error");
            var thrown = false;
            var start = Date.now();
            pool.addGenericTask({
                generator: function () {
                    return wait(tick).then(function () {
                        pool.addGenericTask({
                            generator: function () {
                                return wait(tick).then(function () {
                                    thrown = true;
                                    throw new Error("Child task error");
                                });
                            },
                            invocationLimit: 1,
                        });
                        debug("About to throw");
                        throw error;
                    });
                },
                invocationLimit: 1,
            });
            return chai_1.expect(pool.waitForIdle()).to.be.rejectedWith(error)
                .then(function () {
                expectTimes([Date.now() - start], [1], "Timing Results");
                chai_1.expect(thrown).to.equal(false, "Child task must throw yet");
                return wait(tick * 2);
            }).then(function () {
                chai_1.expect(thrown).to.equal(true, "Child task must throw error");
            });
        });
        describe("Clearing After Delay", function () {
            it("Promise Rejection", function () {
                var pool = new Pool.PromisePoolExecutor();
                var error = new Error();
                return Promise.all([
                    chai_1.expect(pool.addGenericTask({
                        generator: function () {
                            return wait(1).then(function () {
                                throw error;
                            });
                        },
                        invocationLimit: 1,
                    }).promise()).to.be.rejectedWith(error),
                    wait(tick).then(function () { return pool.waitForIdle(); }).catch(function () {
                        throw new Error("Error did not clear");
                    }),
                ]);
            });
        });
    });
    describe("group.waitForIdle", function () {
        it("Generator Function (synchronous)", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            var group = pool.addGroup({});
            pool.addGenericTask({
                generator: function () {
                    throw error;
                },
                groups: [group],
                invocationLimit: 1,
            });
            return chai_1.expect(group.waitForIdle()).to.be.rejectedWith(error);
        });
        it("Promise Rejection", function () {
            var pool = new Pool.PromisePoolExecutor();
            var error = new Error();
            var group = pool.addGroup({});
            pool.addGenericTask({
                generator: function () {
                    return wait(1).then(function () {
                        throw error;
                    });
                },
                groups: [group],
                invocationLimit: 1,
            });
            return chai_1.expect(group.waitForIdle()).to.be.rejectedWith(error);
        });
    });
});
describe("Miscellaneous Features", function () {
    describe("End Task", function () {
        it("From Generator With No Promise", function () {
            var pool = new Pool.PromisePoolExecutor();
            return pool.addGenericTask({
                generator: function () {
                    this.end();
                },
            }).promise().then(function (results) {
                chai_1.expect(results).to.have.lengthOf(0);
            });
        });
        it("From Generator With Promise", function () {
            var pool = new Pool.PromisePoolExecutor();
            return pool.addGenericTask({
                generator: function () {
                    this.end();
                    // Add one final promise after ending the task
                    return Promise.resolve(1);
                },
            }).promise().then(function (results) {
                chai_1.expect(results).to.deep.equal([1]);
            });
        });
    });
    it("Generator Recursion Prevention", function () {
        var pool = new Pool.PromisePoolExecutor();
        var runCount = 0;
        return pool.addGenericTask({
            generator: function () {
                runCount++;
                // Add a task, triggering it to run
                pool.addGenericTask({
                    generator: function () {
                        // do nothing
                    },
                });
            },
        }).promise().then(function () {
            chai_1.expect(runCount).to.equal(1, "runCount");
        });
    });
    it("Pause/Resume Task", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        var task = pool.addGenericTask({
            generator: function (index) {
                if (index === 0) {
                    this.pause();
                }
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            invocationLimit: 3,
        });
        wait(tick).then(function () {
            task.resume();
        });
        return task.promise().then(function (results) {
            // The task must return the expected non-array result
            expectTimes(results, [1, 2, 2], "Timing Results");
        });
    });
    it("Get Task Status", function () {
        var pool = new Pool.PromisePoolExecutor();
        return pool.addGenericTask({
            concurrencyLimit: 5,
            frequencyLimit: 5,
            frequencyWindow: 1000,
            generator: function () {
                var _this = this;
                return wait(tick)
                    .then(function () {
                    return {
                        activePromiseCount: _this.activePromiseCount,
                        concurrencyLimit: _this.concurrencyLimit,
                        freeSlots: _this.freeSlots,
                        frequencyLimit: _this.frequencyLimit,
                        frequencyWindow: _this.frequencyWindow,
                        invocationLimit: _this.invocationLimit,
                        invocations: _this.invocations,
                        state: _this.state,
                    };
                });
            },
            invocationLimit: 1,
        }).promise().then(function (status) {
            chai_1.expect(status[0]).to.deep.equal({
                activePromiseCount: 1,
                concurrencyLimit: 5,
                freeSlots: 0,
                frequencyLimit: 5,
                frequencyWindow: 1000,
                invocationLimit: 1,
                invocations: 1,
                state: Pool.TaskState.Exhausted,
            });
        });
    });
    describe("waitForIdle", function () {
        it("Simple", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            pool.addGenericTask({
                generator: function () {
                    return wait(tick);
                },
                invocationLimit: 1,
            });
            return pool.waitForIdle()
                .then(function () {
                expectTimes([Date.now() - start], [1], "Timing Results");
            });
        });
        it("Set concurrencyLimit", function () {
            var pool = new Pool.PromisePoolExecutor(1);
            chai_1.expect(pool.concurrencyLimit).to.equal(1);
            pool.concurrencyLimit = 2;
            chai_1.expect(pool.concurrencyLimit).to.equal(2);
        });
        it("Child Task", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            pool.addGenericTask({
                generator: function () {
                    return wait(tick).then(function () {
                        pool.addGenericTask({
                            generator: function () {
                                return wait(tick);
                            },
                            invocationLimit: 1,
                        });
                    });
                },
                invocationLimit: 1,
            });
            return pool.waitForIdle()
                .then(function () {
                expectTimes([Date.now() - start], [2], "Timing Results");
            });
        });
        it("No Task", function () {
            var pool = new Pool.PromisePoolExecutor();
            return pool.waitForIdle();
        });
    });
    describe("waitForGroupIdle", function () {
        it("Simple", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            var group = pool.addGroup({});
            pool.addGenericTask({
                generator: function () {
                    return wait(tick);
                },
                groups: [group],
                invocationLimit: 1,
            });
            return group.waitForIdle()
                .then(function () {
                expectTimes([Date.now() - start], [1], "Timing Results");
            });
        });
        it("Child Task", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            var group = pool.addGroup({});
            pool.addGenericTask({
                generator: function () {
                    return wait(tick).then(function () {
                        pool.addGenericTask({
                            generator: function () {
                                return wait(tick);
                            },
                            groups: [group],
                            invocationLimit: 1,
                        });
                    });
                },
                groups: [group],
                invocationLimit: 1,
            });
            return group.waitForIdle()
                .then(function () {
                expectTimes([Date.now() - start], [2], "Timing Results");
            });
        });
    });
    describe("Configure Task", function () {
        it("Invocation Limit Triggers Completion", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            var task = pool.addGenericTask({
                frequencyLimit: 1,
                frequencyWindow: tick * 2,
                generator: function () {
                    return Promise.resolve(Date.now() - start);
                },
                invocationLimit: 2,
            });
            wait(tick).then(function () {
                task.invocationLimit = 1;
            });
            return task.promise().then(function (results) {
                expectTimes(results.concat([Date.now() - start]), [0, 1], "Timing Results");
            });
        });
    });
    describe("Configure Group", function () {
        it("Triggers Promises", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            var group = pool.addGroup({
                frequencyLimit: 1,
                frequencyWindow: tick * 2,
            });
            wait(tick).then(function () {
                group.frequencyWindow = 1;
                group.frequencyLimit = 1;
            });
            return pool.addGenericTask({
                generator: function () {
                    return Promise.resolve(Date.now() - start);
                },
                groups: [group],
                invocationLimit: 2,
            }).promise().then(function (results) {
                expectTimes(results, [0, 1], "Timing Results");
            });
        });
    });
});
describe("Task Secializations", function () {
    it("Single Task", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        var iteration = 0;
        return pool.addSingleTask({
            data: "test",
            generator: function (data) {
                chai_1.expect(data).to.equal("test");
                // The task cannot run more than once
                chai_1.expect(iteration++).to.equal(0);
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
        }).promise().then(function (result) {
            debug("Test result: " + result + " (" + typeof result + ")");
            // The task must return the expected non-array result
            expectTimes([result], [1], "Timing Results");
        });
    });
    it("Linear Task", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        return pool.addLinearTask({
            generator: function () {
                return wait(tick)
                    .then(function () {
                    return Date.now() - start;
                });
            },
            invocationLimit: 3,
        }).promise().then(function (results) {
            expectTimes(results, [1, 2, 3], "Timing Results");
        });
    });
    it("Each Task", function () {
        var pool = new Pool.PromisePoolExecutor();
        var start = Date.now();
        return pool.addEachTask({
            concurrencyLimit: Infinity,
            data: [3, 2, 1],
            generator: function (element) {
                return wait(tick * element)
                    .then(function () {
                    return Date.now() - start;
                });
            },
        }).promise().then(function (results) {
            expectTimes(results, [3, 2, 1], "Timing Results");
        });
    });
    describe("Batch Task", function () {
        it("Static Batch Size", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            return pool.addBatchTask({
                // Groups the data as [[3, 1], [2]]
                batchSize: 2,
                data: [3, 1, 2],
                generator: function (data) {
                    return wait(tick * sum(data))
                        .then(function () {
                        return Date.now() - start;
                    });
                },
            }).promise().then(function (results) {
                expectTimes(results, [4, 2], "Timing Results");
            });
        });
        it("Dynamic Batch Size", function () {
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            return pool.addBatchTask({
                batchSize: function (elements, freeSlots) {
                    // Groups the data as [[2], [1, 3]]
                    return Math.floor(elements / freeSlots);
                },
                concurrencyLimit: 2,
                data: [2, 1, 3],
                generator: function (data) {
                    return wait(tick * sum(data))
                        .then(function () {
                        return Date.now() - start;
                    });
                },
            }).promise().then(function (results) {
                expectTimes(results, [2, 4], "Timing Results");
            });
        });
    });
    describe("Persistent Batch Task", function () {
        it("Core Functionality", function () {
            var pool = new Pool.PromisePoolExecutor();
            var runCount = 0;
            var task = pool.addPersistentBatchTask({
                generator: function (input) {
                    runCount++;
                    return wait(tick).then(function () { return input.map(String); });
                },
            });
            var inputs = [1, 5, 9];
            var start = Date.now();
            return Promise.all(inputs.map(function (input) {
                return task.getResult(input).then(function (output) {
                    chai_1.expect(output).to.equal(String(input), "Outputs");
                    expectTimes([Date.now() - start], [1], "Timing Results");
                });
            })).then(function () {
                chai_1.expect(runCount).to.equal(1, "runCount");
                // Verify that the task is not storing the results, which would waste memory.
                chai_1.expect(task._task._result.length).to.equal(0);
            });
        });
        it("Offset Batches", function () {
            // Runs two batches of requests, offset so the seconds starts while the first is half finished.
            // The second batch should start before the first finishes.
            var pool = new Pool.PromisePoolExecutor();
            var start = Date.now();
            var runCount = 0;
            var task = pool.addPersistentBatchTask({
                generator: function (input) {
                    runCount++;
                    return wait(tick * 2).then(function () { return input.map(String); });
                },
            });
            var inputs = [[1, 9], [5, 7]];
            return Promise.all(inputs.map(function (input, index) {
                return wait(index * tick).then(function () { return Promise.all(input.map(function (value, index2) {
                    return task.getResult(value).then(function (result) {
                        chai_1.expect(result).to.equal(String(value));
                        expectTimes([Date.now() - start], [index + 2], "Timing result (" + index + "," + index2 + ")");
                    });
                })); });
            })).then(function () {
                chai_1.expect(runCount).to.equal(2, "runCount");
            });
        });
        describe("maxBatchSize", function () {
            it("Core Functionality", function () {
                var pool = new Pool.PromisePoolExecutor();
                var runCount = 0;
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        runCount++;
                        return wait(tick).then(function () { return input.map(String); });
                    },
                    maxBatchSize: 2,
                });
                var inputs = [1, 5, 9];
                var start = Date.now();
                return Promise.all(inputs.map(function (input) {
                    return task.getResult(input).then(function (output) {
                        chai_1.expect(output).to.equal(String(input), "Outputs");
                        expectTimes([Date.now() - start], [1], "Timing Results");
                    });
                })).then(function () {
                    chai_1.expect(runCount).to.equal(2, "runCount");
                });
            });
            it("Instant Start", function () {
                var pool = new Pool.PromisePoolExecutor();
                var runCount = 0;
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        runCount++;
                        return wait(tick).then(function () { return input; });
                    },
                    maxBatchSize: 2,
                });
                var runCounts = [0, 1, 1];
                return Promise.all(runCounts.map(function (expectedRunCount) {
                    // The generator should be triggered instantly when the max batch size is reached
                    var promise = task.getResult(undefined);
                    chai_1.expect(runCount).to.equal(expectedRunCount);
                    return promise;
                }));
            });
        });
        it("queuingDelay", function () {
            var pool = new Pool.PromisePoolExecutor();
            var runCount = 0;
            var task = pool.addPersistentBatchTask({
                generator: function (input) {
                    runCount++;
                    return Promise.resolve(new Array(input.length));
                },
                queuingDelay: tick * 2,
            });
            var delays = [0, 1, 3];
            var start = Date.now();
            return Promise.all(delays.map(function (delay) {
                return wait(delay * tick)
                    .then(function () { return task.getResult(undefined); })
                    .then(function () { return Date.now() - start; });
            })).then(function (results) {
                expectTimes(results, [2, 2, 5], "Timing Results");
                chai_1.expect(runCount).to.equal(2, "runCount");
            });
        });
        it("Delay After Hitting Concurrency Limit", function () {
            var pool = new Pool.PromisePoolExecutor();
            var runCount = 0;
            var task = pool.addPersistentBatchTask({
                concurrencyLimit: 1,
                generator: function (input) {
                    runCount++;
                    return wait(3 * tick).then(function () { return new Array(input.length); });
                },
                queuingDelay: tick,
                queuingThresholds: [1, Infinity],
            });
            var start = Date.now();
            return Promise.all([
                task.getResult(undefined).then(function () {
                    return task.getResult(undefined);
                }),
                wait(2 * tick).then(function () { return task.getResult(undefined); }),
            ].map(function (promise) { return promise.then(function () { return Date.now() - start; }); })).then(function (results) {
                expectTimes(results, [8, 8], "Timing Results");
                chai_1.expect(runCount).to.equal(2, "runCount");
            });
        });
        describe("queueingThresholds", function () {
            it("Core Functionality", function () {
                var pool = new Pool.PromisePoolExecutor();
                var runCount = 0;
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        runCount++;
                        return wait(5 * tick).then(function () { return new Array(input.length); });
                    },
                    queuingThresholds: [1, 2],
                });
                var delays = [0, 1, 2, 3, 4];
                var start = Date.now();
                return Promise.all(delays.map(function (delay) {
                    return wait(delay * tick)
                        .then(function () { return task.getResult(undefined); })
                        .then(function () { return Date.now() - start; });
                })).then(function (results) {
                    expectTimes(results, [5, 7, 7, 9, 9], "Timing Results");
                    chai_1.expect(runCount).to.equal(3, "runCount");
                });
            });
            it("Should Trigger On Task Completion", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        return wait(2 * tick).then(function () { return new Array(input.length); });
                    },
                    queuingThresholds: [1, 2],
                });
                var delays = [0, 1];
                var start = Date.now();
                return Promise.all(delays.map(function (delay) {
                    return wait(delay * tick)
                        .then(function () { return task.getResult(undefined); })
                        .then(function () { return Date.now() - start; });
                })).then(function (results) {
                    expectTimes(results, [2, 4], "Timing Results");
                });
            });
        });
        describe("Retries", function () {
            it("Full", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, batchNumber, runCount, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            batchNumber = 0;
                            runCount = 0;
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                runCount++;
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                batchNumber++;
                                                if (batchNumber < 2) {
                                                    return [2 /*return*/, inputs.map(function () { return Pool.BATCHER_RETRY_TOKEN; })];
                                                }
                                                return [2 /*return*/, inputs.map(function (input) { return input + 1; })];
                                        }
                                    });
                                }); },
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2].map(function (input) { return __awaiter(_this, void 0, void 0, function () {
                                    var output;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, batcher.getResult(input)];
                                            case 1:
                                                output = _a.sent();
                                                chai_1.expect(output).to.equal(input + 1, "getResult output");
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            expectTimes(results, [2, 2], "Timing Results");
                            chai_1.expect(runCount).to.equal(2, "runCount");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Partial", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, batchNumber, runCount, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            batchNumber = 0;
                            runCount = 0;
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                runCount++;
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                batchNumber++;
                                                return [2 /*return*/, inputs.map(function (input, index) {
                                                        return batchNumber < 2 && index < 1 ? Pool.BATCHER_RETRY_TOKEN : input + 1;
                                                    })];
                                        }
                                    });
                                }); },
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2].map(function (input) { return __awaiter(_this, void 0, void 0, function () {
                                    var output;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, batcher.getResult(input)];
                                            case 1:
                                                output = _a.sent();
                                                chai_1.expect(output).to.equal(input + 1, "getResult output");
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            expectTimes(results, [2, 1], "Timing Results");
                            chai_1.expect(runCount).to.equal(2, "runCount");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Ordering", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, batchInputs, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            batchInputs = [];
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                batchInputs.push(inputs);
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, inputs.map(function (input, index) {
                                                        return batchInputs.length < 2 && index < 2 ? Pool.BATCHER_RETRY_TOKEN : input + 1;
                                                    })];
                                        }
                                    });
                                }); },
                                maxBatchSize: 3,
                                queuingThresholds: [1, Infinity],
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2, 3, 4].map(function (input) { return __awaiter(_this, void 0, void 0, function () {
                                    var output;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, batcher.getResult(input)];
                                            case 1:
                                                output = _a.sent();
                                                chai_1.expect(output).to.equal(input + 1, "getResult output");
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            expectTimes(results, [2, 2, 1, 2], "Timing Results");
                            chai_1.expect(batchInputs).to.deep.equal([[1, 2, 3], [1, 2, 4]], "batchInputs");
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Send Method", function () {
            it("Single Use", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, runCount, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            runCount = 0;
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                runCount++;
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, inputs];
                                        }
                                    });
                                }); },
                                queuingDelay: tick,
                                queuingThresholds: [1, Infinity],
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2, 3].map(function (_, index) { return __awaiter(_this, void 0, void 0, function () {
                                    var promise;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                promise = batcher.getResult(undefined);
                                                if (index === 1) {
                                                    chai_1.expect(runCount).to.equal(0, "runCount before");
                                                    batcher.send();
                                                    chai_1.expect(runCount).to.equal(1, "runCount after");
                                                }
                                                return [4 /*yield*/, promise];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            expectTimes(results, [1, 1, 3], "Timing Results");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Effect Delayed By queuingThreshold", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, runCount, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            runCount = 0;
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                runCount++;
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, inputs];
                                        }
                                    });
                                }); },
                                queuingDelay: tick,
                                queuingThresholds: [1, Infinity],
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2, 3].map(function (_, index) { return __awaiter(_this, void 0, void 0, function () {
                                    var promise;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                promise = batcher.getResult(undefined);
                                                if (index === 1) {
                                                    chai_1.expect(runCount).to.equal(0, "runCount before");
                                                    batcher.send();
                                                    chai_1.expect(runCount).to.equal(1, "runCount after");
                                                }
                                                else if (index === 2) {
                                                    batcher.send();
                                                    chai_1.expect(runCount).to.equal(1, "runCount after second");
                                                }
                                                return [4 /*yield*/, promise];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            expectTimes(results, [1, 1, 2], "Timing Results");
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Interaction With Retries", function () { return __awaiter(_this, void 0, void 0, function () {
                var pool, runCount, batcher, start, results;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pool = new Pool.PromisePoolExecutor();
                            runCount = 0;
                            batcher = pool.addPersistentBatchTask({
                                generator: function (inputs) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                runCount++;
                                                return [4 /*yield*/, wait(tick)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, runCount === 1 ? inputs.map(function () { return Pool.BATCHER_RETRY_TOKEN; }) : inputs];
                                        }
                                    });
                                }); },
                                queuingDelay: tick,
                                queuingThresholds: [1, Infinity],
                            });
                            start = Date.now();
                            return [4 /*yield*/, Promise.all([1, 2, 3].map(function (_, index) { return __awaiter(_this, void 0, void 0, function () {
                                    var promise;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                promise = batcher.getResult(undefined);
                                                if (index >= 1) {
                                                    batcher.send();
                                                }
                                                return [4 /*yield*/, promise];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, Date.now() - start];
                                        }
                                    });
                                }); }))];
                        case 1:
                            results = _a.sent();
                            chai_1.expect(runCount).to.equal(2, "runCount");
                            expectTimes(results, [2, 2, 2], "Timing Results");
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Error Handling", function () {
            it("Single Rejection", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        return wait(tick).then(function () { return input.map(function (value) {
                            return value === "error" ? new Error("test") : undefined;
                        }); });
                    },
                });
                var inputs = ["a", "error", "b"];
                return Promise.all(inputs.map(function (input) {
                    return task.getResult(input).then(function () { return true; }).catch(function (err) {
                        chai_1.expect(err.message).to.equal("test");
                        return false;
                    });
                })).then(function (results) {
                    chai_1.expect(results).to.deep.equal([true, false, true]);
                });
            });
            it("Synchronous Generator Exception Followed By Success", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        input.forEach(function (value) {
                            if (value === 0) {
                                throw new Error("test");
                            }
                        });
                        return wait(1).then(function () { return new Array(input.length); });
                    },
                    maxBatchSize: 2,
                });
                var inputs = [0, 1, 2];
                return Promise.all(inputs.map(function (input) {
                    return task.getResult(input).then(function () { return true; }).catch(function (err) {
                        chai_1.expect(err.message).to.equal("test");
                        return false;
                    });
                })).then(function (results) {
                    chai_1.expect(results).to.deep.equal([false, false, true]);
                });
            });
            it("Asynchronous Generator Exception Followed By Success", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        return wait(1).then(function () {
                            input.forEach(function (value) {
                                if (value === 0) {
                                    throw new Error("test");
                                }
                            });
                            return new Array(input.length);
                        });
                    },
                    maxBatchSize: 2,
                });
                var inputs = [0, 1, 2];
                return Promise.all(inputs.map(function (input) {
                    return task.getResult(input).then(function () { return true; }).catch(function (err) {
                        chai_1.expect(err.message).to.equal("test");
                        return false;
                    });
                })).then(function (results) {
                    chai_1.expect(results).to.deep.equal([false, false, true]);
                });
            });
            it("Invalid Output Length", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function (input) {
                        // Respond with an array larger than the input
                        return wait(1).then(function () { return new Array(input.length + 1); });
                    },
                });
                var inputs = [0, 1, 2];
                return Promise.all(inputs.map(function (input) {
                    return task.getResult(input).then(function () { return true; }).catch(function () { return false; });
                })).then(function (results) {
                    chai_1.expect(results).to.deep.equal([false, false, false]);
                });
            });
            it("End Task", function () {
                var pool = new Pool.PromisePoolExecutor();
                var task = pool.addPersistentBatchTask({
                    generator: function () {
                        return wait(tick).then(function () { return []; });
                    },
                });
                var firstPromise = task.getResult(undefined);
                task.end();
                chai_1.expect(task.state === Pool.TaskState.Terminated, "State should be terminated");
                return Promise.all([firstPromise, task.getResult(undefined)].map(function (promise) {
                    return chai_1.expect(promise).to.be.rejectedWith(Error);
                }));
            });
        });
    });
});

# promise-pool-executor

A module for managing ES6 promise concurrency, frequency, and efficiency.

## Installation

npm install promise-pool-executor

## Examples

Promises can be added to the pool in the form of tasks. Tasks use a "generator" function to create promises which fill the task's pool.

### pool.addEachTask

This type of task creates a promise for each element in an array.
```
let PromisePool = require('promise-pool-executor');
// Create a pool with a concurrency limit of 2
let pool = new PromisePool.PromisePoolExecutor({
    concurrencyLimit: 2
});
pool.addEachTask({
    data: [1, 2, 3],
    generator: (element, i) => {
        return Promise.resolve(element + 1);
    }
}).promise().then((results) => {
    console.log(results); // [ 2, 3, 4]
});
```

### pool.addSingleTask

This type of task creates a single promise.
```
let PromisePool = require('promise-pool-executor');
// Create a pool with a no limits set
let pool = new PromisePool.PromisePoolExecutor();
pool.addSingleTask({
    generator: () => {
        return Promise.resolve('finished');
    }
}).promise().then((result) => {
    console.log(result); // finished
});
```

### pool.addGenericTask

Add a general-purpose task.
```
let PromisePool = require('promise-pool-executor');
// Create a pool with a frequency limit of 1 promise per second
let pool = new PromisePool.PromisePoolExecutor({
    frequencyLimit: 1,
    frequencyWindow: 1000,
});
pool.addGenericTask({
    generator: (i) => {
        if (i > 3) {
            return; // end the task
        } else {
            return Promise.resolve(i);
        }
    }
}).promise().then((results) => {
    console.log(results); // [ 0, 1, 2, 3 ]
});
```

### pool.addPersistentBatchTask

This type of task can be used to combine requests into batches with the aim of improving efficiency.
Typically this would be used to combine requests to a website or database to reduce the time required to complete the requests.
```
let PromisePool = require('promise-pool-executor');
// Create a pool with no limits set
let pool = new PromisePool.PromisePoolExecutor();
let runCount = 0;
let persistentBatchTask = pool.addPersistentBatchTask({
    generator: (data) => {
        runCount++;
        return Promise.resolve(data.map(() => {
            return data + 1;
        }));
    }
});
let inputs = [1, 3, 5, 7];
let promises = inputs.map((input) => persistentBatchTask.getResult(input));
Promise.all(promises).then((results) => {
    console.log(results); // [ 2, 4, 6, 8 ]
    console.log(runCount); // 1
});
```

## API Reference

### Object: PromisePoolExecutor

#### Properties

* pool.**activePromiseCount** - The number of promises active in the pool *(read-only)*.
* pool.**activeTaskCount** - The number of tasks active in the pool *(read-only)*.
* pool.**concurrencyLimit** - The maximum number of promises which are allowed to run in the pool at one time.
* pool.**frequencyLimit** - The maximum number of times a promise can be invoked within the time window specified by pool.frequencyWindow.
* pool.**frequencyWindow** - The time window in milliseconds to use for pool.frequencyLimit.
* pool.**freeSlots** - The number of promises which can be created before reaching the pool's configured limits *(read-only)*.

#### Methods

* pool.**addBatchTask(options)** - Adds a task which generates a promise for batches of elements from an array. Returns a promise which resolves to an array containing the results of the task. Accepts a parameters object with the following properties:
  * options.**batchSize** - Either a number indicating the number of elements in each batch, or a function which returns the number of elements in each batch. If using batchSize as a function, parameters are passed to the function for the current array index and the number of free slots.
  * options.**concurrencyLimit** - The maximum number of promises that can be active simultaneously for the task *(optional)*.
  * options.**data** - An array containing data to be divided into batches and passed to the generator function.
  * options.**generator** - A function which returns a new promise each time it is run. Is passed arguments for the current element of options.data, and the element's index.
  * options.**groups** - An array of groups to assign the task to. Groups are created using pool.addGroup(options) *(optional)*.
  * options.**invocationLimit** - The maximum number of times the task can be invoked *(optional)*.
  * options.**paused** - Starts the task in a paused state *(optional)*.
* pool.**addEachTask(options)** - Adds a task which generates a promise for each element in an array. Returns a promise which resolves to an array containing the results of the task. Accepts a parameters object with the following properties:
  * options.**data** - An array, each element of which will be passed to the generator function.
  * options.**generator** - A function which returns a new promise each time it is run. Optionally accepts a first argument for the current element of options.data, and a second argument for the element's index.
  * options.**concurrencyLimit** - The maximum number of promises that can be active simultaneously for the task *(optional)*.
  * options.**groups** - An array of groups to assign the task to. Groups are created using pool.addGroup(options) *(optional)*.
  * options.**invocationLimit** - The maximum number of times the task can be invoked *(optional)*.
  * options.**paused** - Starts the task in a paused state *(optional)*.
* pool.**addGenericTask(options)** - Adds a general-purpose task. Returns a promise which resolves to an array containing the results of the task. Accepts a parameters object with the following properties:
  * options.**generator** - A function which returns a new promise each time it is run, or null to indicate the task is completed.
  * options.**concurrencyLimit** - The maximum number of promises that can be active simultaneously for the task *(optional)*.
  * options.**groups** - An array of groups to assign the task to. Groups are created using pool.addGroup(options) *(optional)*.
  * options.**invocationLimit** - The maximum number of times the task can be invoked *(optional)*.
  * options.**paused** - Starts the task in a paused state *(optional)*.
* pool.**addGroup(options)** - Adds a group to the pool, returning a PromisePoolGroup object. Groups can be used to specify limits for how often a subset of tasks can be invoked, or to respond when a subset of tasks has completed.
  * options.**concurrencyLimit**
* pool.**addLinearTask(options)** - Adds a task with a concurrency limit of 1. Returns a PromisePoolTask object which can be resolved to an array containing the results of the task.
  * options.**generator** - A function which returns a new promise each time it is run, or null to indicate the task is completed.
  * options.**groups** - An array of groups to assign the task to. Groups are created using pool.addGroup(options) *(optional)*.
  * options.**invocationLimit** - The maximum number of times the task can be invoked *(optional)*.
  * options.**paused** - Starts the task in a paused state *(optional)*.
* pool.**addPersistentBatchTask(options)** - Returns a PersistentBatchTask object, which can be used to combine multiple requests into batches to improve efficiency.
  * options.**generator** - A function which accepts an array of request values, returning a promise which resolves to an array of response values. The request and response arrays must be of equal length. To reject an individual request, return an Error object (or class which extends Error) at the corresponding element in the response array.
  * options.**maxBatchSize** - A number indicating the maximum number of requests that can be combined in a single batch.
  * options.**queuingDelay** - The number of milliseconds to wait before running a batch of requests. This is used to allow time for the requests to queue up. Defaults to 1ms. This delay does not apply if the limit set by options.maxBatchSize is reached.
  * options.**queuingThresholds** - An array containing the number of requests that must be queued in order to trigger a batch request at each level of concurrency. For example [1, 5], would require at least 1 queued request when no batch requests are active, and 5 queued requests when 1 (or more) batch requests are active. Defaults to [1]. Note that the delay imposed by options.queuingDelay still applies when a batch request is triggered.
* pool.**addSingleTask(options)** - Adds a task with a single promise. Returns a promise which resolves to the result of the task. Accepts a parameters object with the following properties:
  * options.**generator** - A function which returns a promise.
  * options.**data** - A variable which gets passed as the first argument to the generator function *(optional)*.
  * options.**groups** - An array of groups to assign the task to. Groups are created using pool.addGroup(options) *(optional)*.
  * options.**paused** - Starts the task in a paused state *(optional)*.
* pool.**waitForIdle()** - Returns a promise which resolves when no tasks are active (or paused) in the pool.

### Object: PromisePoolGroup

* group.**activePromiseCount** - The number of promises active in the group *(read-only)*.
* group.**activeTaskCount** - The number of tasks active in the group *(read-only)*.
* group.**concurrencyLimit** - The maximum number of promises which are allowed to run in the group at one time.
* group.**frequencyLimit** - The maximum number of times a promise can be invoked within the time window specified by group.frequencyWindow.
* group.**frequencyWindow** - The time window in milliseconds to use for group.frequencyLimit.
* group.**freeSlots** - The number of promises which can be created before reaching the group's configured limits *(read-only)*.

#### Properties

#### Methods

* pool.**waitForIdle()** - Returns a promise which resolves when no tasks are active (or paused) in the pool.

### Object: PromisePoolTask
A task which can generate promises within a pool.

#### Properties

* task.**activePromiseCount** - The number of promises active in the task *(read-only)*.
* task.**concurrencyLimit** - The maximum number of promises which are allowed to run in the task at one time.
* task.**frequencyLimit** - The maximum number of times a promise can be invoked within the time window specified by task.frequencyWindow.
* task.**frequencyWindow** - The time window in milliseconds to use for task.frequencyLimit.
* task.**freeSlots** - The number of promises which can be created before reaching the task's configured limits *(read-only)*.
* task.**state** - An enumeration representing the current state of the task *(read-only)*.
  * TaskState.**Active** - The task will create promises as permitted by the configured limits.
  * TaskState.**Paused** - No action will be taken until task.resume() or task.end() is called.
  * TaskState.**Exhausted** - The task has ended, but there are still promises from this task running.
  * TaskState.**Terminated** - The task has ended.

#### Methods

* task.**end()** - Ends the task, preventing the generator function from being called again.
* task.**promise()** - Returns a promise which resolves to the result of the task upon completion, or rejects on error.

### Object: PersistentBatchTask
A task which can be used to combine multiple requests into batches to improve efficiency. Typical uses would include combining single web API or database calls into batch calls.

#### Properties

*Same as [PromisePoolTask](#ObjectPromisePoolTask)*

#### Methods

* persistentBatchTask.**end()** - Ends the task, preventing the generator function from being called again.
* persistentBatchTask.**getResult(input)** - Returns a promise which resolves or rejects with the individual result returned from the task's generator function.

## License

The MIT License (MIT)

Copyright (c) 2017 Wes van Vugt

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { PromisePoolGroupInternal } from "../private/group";
import { PromisePoolGroup, PromisePoolGroupConfig } from "./group";
import { PromisePoolExecutor } from "./pool";

export interface InvocationLimit {
    /**
     * Limits the number of times a promise will be invoked.
     */
    invocationLimit?: number;
}

export interface TaskLimits extends PromisePoolGroupConfig, InvocationLimit { }

export interface TaskGeneral {
    /**
     * An array of values, each of which identifies a group the task belongs to. These groups can be used to respond
     * to the completion of a larger task.
     */
    groups?: PromisePoolGroup[];
    /**
     * Starts the task in a paused state if set to true.
     */
    paused?: boolean;
}

export interface GenericTaskParamsBase extends TaskGeneral, TaskLimits { }

export interface GenericTaskParams<R> extends GenericTaskParamsBase {
    /**
     * Function used for creating promises to run.
     * This function will be run repeatedly until it returns null or the concurrency or invocation limit is reached.
     * @param invocation The invocation number for this call, starting at 0 and incrementing by 1 for each call.
     */
    generator: (this: PromisePoolTask<any[]>, invocation: number) => Promise<R> | null;
}

export interface GenericTaskParamsConverted<I, R> extends GenericTaskParamsBase {
    generator: (this: PromisePoolTask<any>, invocation: number) => Promise<I> | null;
    resultConverter: (result: I[]) => R;
}

export enum TaskState {
    /**
     * The task is active promises will be generated by the pool according to the limits set.
     */
    Active,
    /**
     * The task is paused and may be ended or resumed later. Any outstanding promises will continue to run.
     */
    Paused,
    /**
     * The task has completed all the work provided by the generator. The task will terminate when all outstanding
     * promises have ended.
     */
    Exhausted,
    /**
     * All outstanding promises have ended and the result has been returned or an error thrown.
     */
    Terminated,
}

export interface PromisePoolTask<R> {
    readonly activePromiseCount: number;
    readonly invocations: number;
    invocationLimit: number;
    concurrencyLimit: number;
    frequencyLimit: number;
    frequencyWindow: number;
    readonly freeSlots: number;
    readonly state: TaskState;
    pause(): void;
    resume(): void;
    end(): void;
    promise(): Promise<R>;
}

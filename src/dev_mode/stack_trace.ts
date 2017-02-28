/**
 * Stack trace improvements in Dev Mode.
 *
 * When exception is thrown, their stack traces will be augmented with Components stack trace.
 */
import { DEV_MODE, DevModeFlags, getFunctionName } from "./dev_mode";
import { ComponentClass, ComponentFunction, Component } from "../vdom/component";

declare global {
    /**
     * V8 Stack Trace CallSite.
     *
     * https://github.com/v8/v8/wiki/Stack-Trace-API
     */
    interface CallSite {
        /**
         * Returns the value of this.
         *
         * To maintain restrictions imposed on strict mode functions, frames that have a strict mode function and all
         * frames below (its caller etc.) are not allow to access their receiver and function objects. For those frames,
         * getFunction() and getThis() will return undefined.
         */
        getThis(): any;
        /**
         * Returns the type of this as a string. This is the name of the function stored in the constructor field of
         * this, if available, otherwise the object's [[Class]] internal property.
         */
        getTypeName(): string;
        /**
         * Returns the current function.
         *
         * To maintain restrictions imposed on strict mode functions, frames that have a strict mode function and all
         * frames below (its caller etc.) are not allow to access their receiver and function objects. For those frames,
         * getFunction() and getThis() will return undefined.
         */
        getFunction(): Function | undefined;
        /**
         * Returns the name of the current function, typically its name property. If a name property is not available an
         * attempt will be made to try to infer a name from the function's context.
         */
        getFunctionName(): string | null;
        /**
         * Returns the name of the property of this or one of its prototypes that holds the current function.
         */
        getMethodName(): string | null;
        /**
         * If this function was defined in a script returns the name of the script.
         */
        getFileName(): string;
        /**
         * If this function was defined in a script returns the current line number.
         */
        getLineNumber(): number;
        /**
         * If this function was defined in a script returns the current column number.
         */
        getColumnNumber(): number;
        /**
         * If this function was created using a call to eval returns a CallSite object representing the location where
         * eval was called.
         */
        getEvalOrigin(): CallSite | string;
        /**
         * Is this a toplevel invocation, that is, is this the global object?
         */
        isToplevel(): boolean;
        /**
         * Does this call take place in code defined by a call to eval?
         */
        isEval(): boolean;
        /**
         * Is this call in native V8 code?
         */
        isNative(): boolean;
        /**
         * Is this a constructor call?
         */
        isConstructor(): boolean;
    }

    interface ErrorConstructor {
        prepareStackTrace(e: any, callSites: CallSite[]): any;
    }
}

function _extractCallSitesFromStackTrace(e: any, callSites: CallSite[]): CallSite[] {
    return callSites;
}

/**
 * Get current call sites in browsers that support `prepareStackTrace` and `captureStackTrace` API.
 *
 * @returns CallSite array or undefined.
 */
export function callSites(): CallSite[] | undefined {
    if (__IVI_DEV__) {
        if (DEV_MODE & DevModeFlags.CaptureStackTraceSupported) {
            const e = {} as { stack: CallSite[] };
            const prepare = Error.prepareStackTrace;
            Error.prepareStackTrace = _extractCallSitesFromStackTrace;
            Error.captureStackTrace(e, callSites);
            Error.prepareStackTrace = prepare;
            return e.stack;
        }
    }
    return;
}

/**
 * Components stack trace from an entry point.
 */
export let STACK_TRACE: Array<ComponentClass<any> | ComponentFunction<any>> | undefined;
/**
 * Component instances stack trace.
 */
export let STACK_TRACE_INSTANCES: Array<Component<any>> | undefined;

/**
 * Push component into stack trace.
 *
 * @param component Component.
 */
export function stackTracePushComponent(component: ComponentClass<any>, instance: Component<any>): void;
export function stackTracePushComponent(component: ComponentFunction<any>): void;
export function stackTracePushComponent(
    component: ComponentClass<any> | ComponentFunction<any>,
    instance?: Component<any>,
): void {
    if (__IVI_DEV__) {
        if (!(DEV_MODE & DevModeFlags.DisableStackTraceAugmentation)) {
            if (!STACK_TRACE) {
                STACK_TRACE = [];
            }
            STACK_TRACE.push(component);
            if (instance) {
                if (!STACK_TRACE_INSTANCES) {
                    STACK_TRACE_INSTANCES = [];
                }
                STACK_TRACE_INSTANCES.push(instance);
            }
        }
    }
}

/**
 * Pop component from stack trace.
 */
export function stackTracePopComponent(): void {
    if (__IVI_DEV__) {
        if (!(DEV_MODE & DevModeFlags.DisableStackTraceAugmentation)) {
            const c = STACK_TRACE!.pop();
            if ((c as ComponentClass<any>).prototype.render) {
                STACK_TRACE_INSTANCES!.pop();
            }
        }
    }
}

/**
 * Reset stack trace.
 */
export function stackTraceReset(): void {
    if (__IVI_DEV__) {
        if (!(DEV_MODE & DevModeFlags.DisableStackTraceAugmentation)) {
            STACK_TRACE = undefined;
            STACK_TRACE_INSTANCES = undefined;
        }
    }
}

export interface ComponentStackTraceFrame {
    type: "F" | "C";
    name: string;
    debugId: number | null;
    instance: Component<any> | null;
}

/**
 * Build current stack trace.
 *
 * @returns Current component stack.
 */
export function componentStackTrace(): ComponentStackTraceFrame[] | null {
    if (__IVI_DEV__) {
        if (STACK_TRACE && (STACK_TRACE.length > 0)) {
            const result: ComponentStackTraceFrame[] = [];

            let j = STACK_TRACE_INSTANCES ? STACK_TRACE_INSTANCES.length - 1 : 0;
            for (let i = STACK_TRACE.length - 1; i >= 0; i--) {
                const c = STACK_TRACE[i];
                if (c.prototype.render) {
                    result.push({
                        type: "F",
                        name: getFunctionName(c),
                        debugId: null,
                        instance: null,
                    });
                } else {
                    const instance = STACK_TRACE_INSTANCES![j--];
                    result.push({
                        type: "C",
                        name: getFunctionName(c),
                        debugId: instance._debugId,
                        instance: instance,
                    });
                }
            }
            return result;
        }
    }

    return null;
}

/**
 * Print current Components stack trace.
 *
 * @returns Stack trace.
 */
function stackTraceToString(): string {
    let result = "";
    const components = componentStackTrace();

    if (components) {
        for (const component of components) {
            result += "\n";
            result += "  ";
            if (component.type === "F") {
                result += `[F]${component.name}`;
            } else {
                result += `[C]${component.name} #${component.debugId}`;
            }
        }
    }

    return result;
}

/**
 * Augment `Error` stack trace with Components stack trace.
 *
 * @param e Error instance.
 */
export function stackTraceAugment(e: Error): void {
    if (__IVI_DEV__) {
        if (!(DEV_MODE & DevModeFlags.DisableStackTraceAugmentation)) {
            if (e.stack) {
                e.stack += "\n\nComponents stack trace:" + stackTraceToString();
            }
        }
    }
}

/**
 * Prints current component stack trace to the console.
 */
export function printComponentStackTrace(): void {
    if (__IVI_DEV__) {
        if (__IVI_BROWSER__) {
            const components = componentStackTrace();
            if (components) {
                console.groupCollapsed("Component Stack Trace:");
                for (const component of components) {
                    if (component.type === "F") {
                        console.log(`  [F]${component.name}`);
                    } else {
                        console.groupCollapsed(`  [C]${component.name} #${component.debugId}`);
                        console.log(component.instance);
                        console.groupEnd();
                    }
                }
                console.groupEnd();
            }
        }
    }
}

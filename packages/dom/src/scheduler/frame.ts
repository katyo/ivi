import { NOOP } from "ivi-core";
import { isVisible, addVisibilityObserver } from "../misc/visibility";
import { FrameTasksGroupFlags, FrameTasksGroup } from "./frame_tasks_group";
import { executeDOMReaders } from "./dom_reader";
import { incrementClock } from "./clock";
import { scheduleMicrotask } from "./microtask";
import { executeAnimations, shouldRequestNextFrameForAnimations } from "./animation";

let _update: () => void = NOOP;
let _pending = false;
let _currentFrameReady = false;
let _currentFrame = new FrameTasksGroup();
let _nextFrame = new FrameTasksGroup();
let _frameStartTime = 0;
let _autofocusedElement: Element | null = null;

_currentFrame._rwLock();

function _updateFrameStartTime(time?: number): void {
    if (__IVI_BROWSER__) {
        _frameStartTime = (time === undefined ? performance.now() : time) / 1000;
    }
}

export function autofocus(element: Element): void {
    _autofocusedElement = element;
}

export function setUpdateFunction(update: () => void): void {
    _update = update;
}

/**
 * @returns current frame start time.
 */
export function frameStartTime(): number {
    return _frameStartTime;
}

_updateFrameStartTime();

function _requestNextFrame(): void {
    if (__IVI_BROWSER__) {
        if (_pending === true) {
            requestAnimationFrame(handleNextFrame);
        }
    }
}

/**
 * Trigger next frame tasks execution.
 */
export function requestNextFrame(): void {
    if (__IVI_BROWSER__) {
        if (_pending === false) {
            _pending = true;
            scheduleMicrotask(_requestNextFrame);
        }
    }
}

/**
 * Frame tasks scheduler event handler.
 *
 * @param t Current time.
 */
function handleNextFrame(time?: number): void {
    _updateFrameStartTime(time);

    let tasks: (() => void)[];
    let i: number;

    _pending = false;
    _currentFrameReady = true;

    const frame = _nextFrame;
    _nextFrame = _currentFrame;
    _currentFrame = frame;

    _currentFrame._rwUnlock();
    _nextFrame._rwUnlock();

    executeDOMReaders();

    // Perform read/write batching. Start with executing read DOM tasks, then update components, execute write DOM tasks
    // and repeat until all read and write tasks are executed.
    do {
        while (frame._flags & FrameTasksGroupFlags.Read) {
            frame._flags &= ~FrameTasksGroupFlags.Read;
            tasks = frame._readTasks!;
            frame._readTasks = null;

            for (i = 0; i < tasks.length; i++) {
                tasks[i]();
            }
        }

        while (frame._flags & (FrameTasksGroupFlags.Component | FrameTasksGroupFlags.Write)) {
            if (frame._flags & FrameTasksGroupFlags.Write) {
                frame._flags &= ~FrameTasksGroupFlags.Write;
                tasks = frame._writeTasks!;
                frame._writeTasks = null;
                for (i = 0; i < tasks.length; i++) {
                    tasks[i]();
                }
            }

            if (frame._flags & FrameTasksGroupFlags.Component) {
                frame._flags &= ~FrameTasksGroupFlags.Component;
                _update();
            }
        }
    } while (frame._flags & (
        FrameTasksGroupFlags.Component |
        FrameTasksGroupFlags.Write |
        FrameTasksGroupFlags.Read
    ));

    _currentFrameReady = false;

    // Lock current frame from adding read and write tasks in debug mode.
    _currentFrame._rwLock();

    if (isVisible()) {
        executeAnimations();
    }

    // Perform tasks that should be executed when all DOM ops are finished.
    while ((frame._flags & FrameTasksGroupFlags.After) !== 0) {
        frame._flags &= ~FrameTasksGroupFlags.After;

        tasks = frame._afterTasks!;
        frame._afterTasks = null;
        for (i = 0; i < tasks.length; i++) {
            tasks[i]();
        }
    }

    if (_autofocusedElement !== null) {
        (_autofocusedElement as HTMLElement).focus();
        _autofocusedElement = null;
    }

    if (shouldRequestNextFrameForAnimations()) {
        requestNextFrame();
    }

    incrementClock();
}

/**
 * Get task list for the next frame.
 *
 * @returns Frame tasks group.
 */
export function nextFrame(): FrameTasksGroup {
    requestNextFrame();
    return _nextFrame;
}

/**
 * Get task list for the current frame.
 *
 * @returns Frame tasks group.
 */
export function currentFrame(): FrameTasksGroup {
    if (_currentFrameReady === true) {
        return _currentFrame;
    }
    return nextFrame();
}

/**
 * Perform a synchronous frame update.
 */
export function syncFrameUpdate(): void {
    handleNextFrame();
}

function handleVisibilityChange(visible: boolean): void {
    if (visible) {
        if (shouldRequestNextFrameForAnimations()) {
            requestNextFrame();
        }
    }
}

if (__IVI_BROWSER__) {
    addVisibilityObserver(handleVisibilityChange);
}
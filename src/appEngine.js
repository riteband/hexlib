import createStateStore from "./stateStore";

function noop() {
}

export default function createAppEngine({
    stateStore: _stateStore,
    initialState,
    render,
    performSideEffectsFns: _performSideEffectsFns,
    onStateChange,
    system: _system
}) {
    if (!initialState && !_stateStore) {
        throw new Error("initialState or stateStore required");
    }

    if (_stateStore && !_stateStore.getState()) {
        throw new Error("stateStore needs to have a state");
    }

    if (initialState && _stateStore) {
        throw new Error("Can't have both initialState and stateStore");
    }

    function stop() {

    }

    var sideEffectFns = [];

    function addSideEffectFn(fn, {callOnAdd = true} = {}) {
        sideEffectFns.push(fn);
        callOnAdd && fn(getFnParams());
    }

    function addSideEffectFns(fns, options) {
        fns.forEach((fn) => addSideEffectFn(fn, options));
    }

    function removeSideEffectFn(fn) {
        sideEffectFns = sideEffectFns.filter(item => item !== fn);
    }

    function removeSideEffectFns(fns) {
        fns.forEach(removeSideEffectFn);
    }

    function performSideEffects () {
        sideEffectFns.forEach(function (fn) {
            fn(getFnParams());
        });
    }

    function getFnParams() {
        return {
            system: system,
            state: stateStore.getState(),
            changeState: stateStore.changeState
        };
    }

    // 1) For each state change, we want to perform side effects, render and trigger onStateChange.
    //    Side effects may cause new state changes. We want to optimize so that render and onStateChange is only
    //    performed once per JS execution frame, regardless of the number of state changes.
    //    By keeping track of the number of times the updateApp has been invoked, we can make sure to
    //    only render and trigger onStateChange when we're in the last update closure.

    var updateCallsForCurrentFrame = 0; // 1

    function updateApp() {
        // 1
        updateCallsForCurrentFrame++;
        const updateCallsBeforeSideEffects = updateCallsForCurrentFrame;

        // May lead to more calls to updateApp
        performSideEffects(getFnParams());

        // 1
        if (updateCallsForCurrentFrame !== updateCallsBeforeSideEffects) {
            // Only render and trigger onStateChange for the last updateApp closure.
            return;
        }

        engine.render(getFnParams());
        engine.onStateChange(getFnParams());
    }

    const stateStore = _stateStore || createStateStore({initialState});
    const system = _system;
    const engine = {
        render: render || noop,
        onStateChange: onStateChange || noop,
        stop: stop,
        stateStore: stateStore,
        system: system,
        changeState: stateStore.changeState,
        addSideEffectFn: addSideEffectFn,
        addSideEffectFns: addSideEffectFns,
        removeSideEffectFn: removeSideEffectFn,
        removeSideEffectFns: removeSideEffectFns
    };

    stateStore.addStateChangeListener(updateApp);

    if (_performSideEffectsFns) {
        addSideEffectFns(_performSideEffectsFns, {callOnAdd: false});
    }

    updateApp();

    return engine;
}

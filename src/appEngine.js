import Atom from "./atom";

function noop() {
}

export default function AppEngine({
    stateAtom: _stateAtom,
    initialState,
    render,
    performSideEffects: _performSideEffects,
    onStateChange,
    system: _system
}) {
    if (!initialState && !_stateAtom) {
        throw new Error("initialState or stateAtom required");
    }

    if (_stateAtom && !_stateAtom.deref()) {
        throw new Error("stateAtom needs to have a state");
    }

    if (initialState && _stateAtom) {
        throw new Error("Can't have both initialState and stateAtom");
    }

    function stop() {

    }

    var sideEffectFns = [];

    function addSideEffectFn(fn) {
        sideEffectFns.push(fn);
        fn(getFnParams());
    }

    function removeSideEffectFn(fn) {
        sideEffectFns = sideEffectFns.filter(item => item !== fn);
    }

    if (_performSideEffects) {
        addSideEffectFn(_performSideEffects);
    }

    function performSideEffects () {
        sideEffectFns.forEach(function (fn) {
            fn(getFnParams());
        });
    }

    const atom = _stateAtom || Atom(initialState);
    const system = _system;
    const engine = {
        render: render || noop,
        onStateChange: onStateChange || noop,
        stop: stop,
        stateAtom: atom,
        system: system,
        swapState: atom.swap,
        addSideEffectFn: addSideEffectFn,
        removeSideEffectFn: removeSideEffectFn
    };

    function getFnParams() {
        return {
            system: system,
            state: atom.deref(),
            swapState: atom.swap
        };
    }

    // 1) For each state change, we want to perform side effects, render and trigger onStateChange.
    //    Side effects may cause new state changes. We want to optimize so that render and onStateChange is only
    //    performed once per JS execution frame, regardless of the number of state changes.
    //    By keeping track of the number of times the updateApp has been invoked, we can make sure to
    //    only render and trigger onStateChange when we're in the last update closure.

    var updateCallsForCurrentFrame = 0; // 1

    function updateApp(state) {
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

    atom.onChange(updateApp);

    updateApp(atom.deref());

    return engine;
}

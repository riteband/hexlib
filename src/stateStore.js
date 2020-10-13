export default function createStateStore({initialState}) {
    let state = initialState;
    let listeners = [];

    function setState(newState) {
        state = newState;
        listeners.forEach(function (listener) {
            listener(state);
        })
        return newState;
    }

    return {
        setState: setState,
        changeState: function (f, args) {
            if (arguments[0] === state) {
                throw new Error("First argument is the state, you should not pass it in manually. The function given will automatically get the state as the first parameter.");
            }

            let newState = f.apply(null, [state].concat([].slice.call(arguments, 1)));

            if (!newState) {
                throw new Error("No state after calling: " + f.name + ". The function provided to changeState must always return a new state.");
            } else {
                return setState(newState);
            }
        },
        getState: function () {
            return state;
        },
        addStateChangeListener: function (listener) {
            listeners.push(listener);
        },
        removeStateChangeListener: function (listener) {
            listeners = listeners.filter(l => l !== listener);
        }
    }
}

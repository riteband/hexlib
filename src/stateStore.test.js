import createStateStore from './stateStore';

describe('StateStore', function () {
    it('getState', function () {
        let stateStore = createStateStore({initialState: {a: "a"}});
        expect(stateStore.getState()).toEqual({a: "a"});
    });
    it('setState', function () {
        let stateStore = createStateStore({initialState: {a: "a"}});

        expect(stateStore.setState({a: "aa"})).toEqual({a: "aa"});
        expect(stateStore.getState()).toEqual({a: "aa"});
    });
    it('changeState', function () {
        let stateStore = createStateStore({initialState: {}});

        function changeStateFn(state) {
            state.a = "a";
            return state
        }

        expect(stateStore.changeState(changeStateFn)).toEqual({a: "a"});
        expect(stateStore.getState()).toEqual({a: "a"});

        function changeStateFnWithArgs(state, value) {
            state.a = value;
            return state
        }

        expect(stateStore.changeState(changeStateFnWithArgs, "aa")).toEqual({a: "aa"});

        function changeStateFnWithError(state) {
            state.a = "a";
        }

        function callChangeStateFn() {
            stateStore.changeState(changeStateFnWithError);
        }

        // Calling changeState in expect does not work, jest needs a function (not a function call).
        expect(callChangeStateFn).toThrowError();
    });
    it('addStateChangeListener & removeStateChangeListener', function () {
        let stateStore = createStateStore({initialState: {a: "a"}});
        const listener = jest.fn();
        stateStore.addStateChangeListener(listener);
        stateStore.setState({a: "aa"});
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({a: "aa"});

        function changeStateFn(state) {
            state.a = "aaa";
            return state;
        }

        stateStore.changeState(changeStateFn);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenCalledWith({a: "aaa"});

        const listener2 = jest.fn();
        stateStore.addStateChangeListener(listener2);
        stateStore.setState({a: "a"});
        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener).toHaveBeenCalledWith({a: "a"});
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith({a: "a"});

        stateStore.removeStateChangeListener(listener);
        stateStore.setState({a: "a"});
        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener2).toHaveBeenCalledTimes(2);
    });
});

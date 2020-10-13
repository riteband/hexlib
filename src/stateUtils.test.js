import * as stateUtils from './stateUtils';
import createStateStore from "./stateStore";
import {describe, expect, it} from "@jest/globals";

describe('state utils', function () {
    describe('createChangeSubState', function () {
        it('should work', function () {
            let stateStore = createStateStore({initialState: {
                subState: {
                    a: 2,
                    m: {
                        c: 0
                    }
                },
                b: 3
            }});
            function adder(state, id, n) {
                state[id] += n;
                return state;
            }

            let subChangeState = stateUtils.createChangeSubState(stateStore.changeState, "subState");
            subChangeState(adder, "a", 1);
            expect(stateStore.getState()).toEqual({
                subState: {
                    a: 3,
                    m: {
                        c: 0
                    }
                },
                b: 3
            });

            let subsubChangeState = stateUtils.createChangeSubState(subChangeState, "m");
            subsubChangeState(adder, "c", -1);
            expect(stateStore.getState()).toEqual({
                subState: {
                    a: 3,
                    m: {
                        c: -1
                    }
                },
                b: 3
            });

            subChangeState = stateUtils.createChangeSubState(stateStore.changeState, ["subState", "m"]);
            subChangeState(adder, "c", 5);
            expect(stateStore.getState()).toEqual({
                subState: {
                    a: 3,
                    m: {
                        c: 4
                    }
                },
                b: 3
            });
        });
    });
});

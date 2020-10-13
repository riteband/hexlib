import _ from "understreck";
import * as stateUtils from "./stateUtils";

export function wrapSubStatePerformSideEffects(performSideEffects) {
    return function (args) {
        let stateId = _.isArray(args.stateId) ? args.stateId : [args.stateId];
        let swapState = stateUtils.createSwapSubState(args.swapState, stateId);
        let state = _.get(args.state, stateId);
        if (!state) {
            throw new Error("Couldn't find state for module, did you forget to set stateId?")
        }
        let setTimeoutWithState = function (f, ms) {
            return args.setTimeoutWithState(function (args2) {
                let swapState = stateUtils.createSwapSubState(args2.swapState, stateId);
                let state = _.get(args2.state, stateId);
                f({...args2, swapState, state, setTimeoutWithState});
            }, ms);
        };
        return performSideEffects({...args, swapState, state, setTimeoutWithState});
    };
}

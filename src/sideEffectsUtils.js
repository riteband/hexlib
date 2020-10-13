import _ from "understreck";
import * as stateUtils from "./stateUtils";

export function wrapSubStatePerformSideEffects(performSideEffects) {
    return function (args) {
        let stateId = _.isArray(args.stateId) ? args.stateId : [args.stateId];
        let changeState = stateUtils.createChangeSubState(args.changeState, stateId);
        let state = _.get(args.state, stateId);
        if (!state) {
            throw new Error("Couldn't find state for module, did you forget to set stateId?")
        }
        let setTimeoutWithState = function (f, ms) {
            return args.setTimeoutWithState(function (args2) {
                let changeState = stateUtils.createChangeSubState(args2.changeState, stateId);
                let state = _.get(args2.state, stateId);
                f({...args2, changeState, state, setTimeoutWithState});
            }, ms);
        };
        return performSideEffects({...args, changeState, state, setTimeoutWithState});
    };
}

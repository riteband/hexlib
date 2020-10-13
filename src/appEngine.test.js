import createAppEngine from './appEngine';

describe('AppEngine', function () {
    it('render optimization', function () {
        var render = jest.fn();
        var onStateChange = jest.fn();
        var performSideEffects = jest.fn(function performSideEffects({state, changeState}) {
            if (state.a < 5) {
                changeState(function (state) {
                    state.a++;
                    return state;
                });
            }
        });


        var appEngine = createAppEngine({
            initialState: {a: 0},
            sideEffectFns: [performSideEffects],
            render: render,
            onStateChange: onStateChange
        });

        expect(performSideEffects).toBeCalledTimes(6);
        expect(render).toBeCalledTimes(1);
        expect(onStateChange).toBeCalledTimes(1);
    });
});

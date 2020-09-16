import * as moduleUtils from './module';
import {describe, expect, it} from "@jest/globals";

describe('module', function () {
    it('fetching service happy flow', function () {
        let serviceId1 = "s1";
        let serviceUrl1 = "url1";
        let serviceId2 = "s2";
        let serviceUrl2 = "url2";
        let state = moduleUtils.createState({
            services: [{
                id: serviceId1,
                url: serviceUrl1
            }, {
                id: serviceId2,
                url: serviceUrl2
            }]
        });

        expect(moduleUtils.shouldFetchService(state, serviceId1)).toBeTruthy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId1)).toBeTruthy();
        expect(moduleUtils.shouldFetchService(state, serviceId2)).toBeTruthy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId2)).toBeTruthy();

        state = moduleUtils.fetchServiceStarted(state, serviceId1);

        expect(moduleUtils.shouldFetchService(state, serviceId1)).toBeFalsy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId1)).toBeTruthy();
        expect(moduleUtils.shouldFetchService(state, serviceId2)).toBeTruthy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId2)).toBeTruthy();

        state = moduleUtils.receiveService(state, serviceId1, "data", true, 200);

        expect(moduleUtils.shouldFetchService(state, serviceId1)).toBeFalsy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId1)).toBeFalsy();
        expect(moduleUtils.shouldFetchService(state, serviceId2)).toBeTruthy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId2)).toBeTruthy();

        state = moduleUtils.fetchServiceStarted(state, serviceId2);
        expect(moduleUtils.shouldFetchService(state, serviceId2)).toBeFalsy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId2)).toBeTruthy();

        state = moduleUtils.receiveService(state, serviceId2, "data", true, 200);
        expect(moduleUtils.shouldFetchService(state, serviceId2)).toBeFalsy();
        expect(moduleUtils.shouldShowServiceLoading(state, serviceId2)).toBeFalsy();
    });

    it('can supply shouldFetch', function () {
        let serviceId1 = "s1";
        let serviceUrl1 = "url1";
        let foo = false;
        let state = moduleUtils.createState({
            services: [{
                id: serviceId1,
                url: serviceUrl1,
                shouldFetch: function () {
                    if (!foo) {
                        foo = true;
                        return false;
                    }
                    return true;
                }
            }]
        });

        expect(moduleUtils.shouldFetchService(state, serviceId1)).toBeFalsy();

        // Now foo has been set to true
        expect(moduleUtils.shouldFetchService(state, serviceId1)).toBeTruthy();
    });

    it('performSideEffects happy flow', function (done) {
        let serviceId1 = "s1";
        let serviceUrl1 = "url1";
        let serviceId2 = "s2";
        let serviceUrl2 = "url2";
        let state = moduleUtils.createState({
            services: [{
                id: serviceId1,
                url: serviceUrl1
            }, {
                id: serviceId2,
                url: serviceUrl2
            }]
        });

        moduleUtils.performSideEffects({
            state,
            swapState: function (f, args) {
                state = f.apply(null, [state].concat([].slice.call(arguments, 1)));
            },
            system: {
                fetch: function (url) {
                    return new Promise(function (resolve, reject) {
                        resolve({
                            ok: true,
                            status: 200,
                            json: function () {
                                return new Promise(function (resolve, reject) {
                                    resolve("data" + url);
                                });
                            }
                        });
                    });
                }
            }
        });

        setTimeout(function () {
            // TODO: Everything should have resolved immediately, but it didn't work without timeout. Should be fixed (in all tests)
            // Also got error when async added to function (but adding something failing inside timeout breaks it, so test gets here)
            expect(moduleUtils.getService(state, serviceId1)).toEqual({
                id: serviceId1,
                url: serviceUrl1,
                fetching: false,
                data: "data" + serviceUrl1,
                ok: true,
                statusCode: 200
            });
            expect(moduleUtils.getService(state, serviceId2)).toEqual({
                id: serviceId2,
                url: serviceUrl2,
                fetching: false,
                data: "data" + serviceUrl2,
                ok: true,
                statusCode: 200
            });
            done()
        }, 0);
    });

    it('performSideEffects fail with json', function (done) {
        let serviceId1 = "s1";
        let serviceUrl1 = "url1";
        let state = moduleUtils.createState({
            services: [{
                id: serviceId1,
                url: serviceUrl1
            }]
        });

        moduleUtils.performSideEffects({
            state,
            swapState: function (f, args) {
                state = f.apply(null, [state].concat([].slice.call(arguments, 1)));
            },
            system: {
                fetch: function (url) {
                    return new Promise(function (resolve, reject) {
                        resolve({
                            ok: true,
                            status: 200,
                            json: function () {
                                return new Promise(function (resolve, reject) {
                                    reject("error");
                                });
                            }
                        });
                    });
                }
            }
        });

        setTimeout(function () {
            expect(moduleUtils.getService(state, serviceId1)).toEqual({
                id: serviceId1,
                url: serviceUrl1,
                fetching: false,
                data: null,
                ok: false,
                statusCode: -1
            });
            done();
        }, 0);
    });

    it('performSideEffects fail with fetch', function (done) {
        let serviceId1 = "s1";
        let serviceUrl1 = "url1";
        let state = moduleUtils.createState({
            services: [{
                id: serviceId1,
                url: serviceUrl1
            }]
        });

        moduleUtils.performSideEffects({
            state,
            swapState: function (f, args) {
                state = f.apply(null, [state].concat([].slice.call(arguments, 1)));
            },
            system: {
                fetch: function (url) {
                    return new Promise(function (resolve, reject) {
                        reject(null);
                    });
                }
            }
        });

        setTimeout(function () {
            expect(moduleUtils.getService(state, serviceId1)).toEqual({
                id: serviceId1,
                url: serviceUrl1,
                fetching: false,
                data: null,
                ok: false,
                statusCode: 0
            });
            done();
        }, 0);
    });
});

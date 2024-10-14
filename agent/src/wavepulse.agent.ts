import { Agent } from './agent';
import { WebSocketChannel } from './channel';
import { CALLS, EVENTS } from './constants';
import { AppInfo, PlatformInfo } from './types';
import { default as axios } from 'axios';

let wavePulseAgent: Agent = new (class WavePulseAgent extends Agent {
    public isConnected = false;

    isFlushAllowed() {
        return this.isConnected;
    }

    connect(debugServerUrl: string) {
        this.setChannel(WebSocketChannel.connect({
            'url': debugServerUrl || ''
        }));
    }

})();
let currentPage = null as any;
type Handler = {
    subscribe: (event: string, callback: (...v: any) => any) => any
};
type ConsoleType = (typeof console) & {
    defaultLog: Function,
    defaultError: Function,
    defaultWarn: Function,
    defaultDebug: Function,
    defaultInfo: Function
};
let handler: Handler = null as any;


function wrapConsole() {
    const _console = console as ConsoleType;
    const prepareLogFn = (logType: string, original: Function) => {
        return function() {
            let args = [...arguments]
            if (logType === 'error' && arguments[0].stack) {
                args.splice(0, 1, arguments[0].stack.toString());
            }
            wavePulseAgent && wavePulseAgent.notify(EVENTS.CONSOLE.LOG, 'event', [{
                type: logType, 
                date: Date.now(), 
                message: Array.from(args)
            }]);
            original.call(_console, ...arguments);
        }
    };
    _console.defaultLog = console.log;
    _console.log = prepareLogFn('log', _console.defaultLog);
    _console.defaultError = console.error;
    _console.error = prepareLogFn('error', _console.defaultError);
    _console.defaultWarn = console.warn;
    _console.warn  = prepareLogFn('warn', _console.defaultWarn);
    _console.defaultDebug = console.debug;
    _console.debug = prepareLogFn('debug', _console.defaultDebug);
    _console.defaultInfo = console.info;
    _console.info = prepareLogFn('info', _console.defaultInfo);
}

function listenPageEvents() {
    handler.subscribe('pageReady', (p: any) => {
        currentPage = p;
        wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
            name: 'PAGE_READY',
            data: {
                name: currentPage.pageName
            },
            startTime: (handler as any).appConfig.diagnostics.pageStartTime,
            endTime: (handler as any).appConfig.diagnostics.pageReadyTime
        }]);
    });
    handler.subscribe('pageAttached', (p: any) => {
        currentPage = p;
        wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
            name: 'PAGE_READY',
            data: {
                name: currentPage.pageName
            },
            startTime: (handler as any).appConfig.diagnostics.pageStartTime,
            endTime: (handler as any).appConfig.diagnostics.pageReadyTime
        }]);
    });
    handler.subscribe('pageDestroyed', (p: any) => {
        currentPage = null;
    });
}

function listenVariableEvents() {
    handler.subscribe('beforeInvoke', (v: any) => {
        wavePulseAgent && wavePulseAgent.notify(EVENTS.VARIABLE.BEFORE_INVOKE, 'event', []);
        v.__diagnostics = v.__diagnostics || {};
        v.__diagnostics.invocationStartTime = Date.now();
        v.__diagnostics.processed = false;
    });
    handler.subscribe('afterInvoke', (v: any) => {
        wavePulseAgent && wavePulseAgent.notify(EVENTS.VARIABLE.AFTER_INVOKE, 'event', []);
        if (v.__diagnostics.processed) {
            return;
        }
        v.__diagnostics.invocationEndTime = Date.now();
        v.__diagnostics.processed = true;
        wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
            name: 'VARIABLE_INVOKE',
            data: {
                name: v.name,
                context: v.config._context === handler ? 'App' : v.config._context.pageName
            },
            startTime: v.__diagnostics.invocationStartTime,
            endTime: v.__diagnostics.invocationEndTime
        }]);
    });
}

function listenServiceCalls() {
    const _axios = (global as any)['axios'] || axios;
    _axios.interceptors.request.use(function (config: any) {
        config.__startTime = Date.now();
        // Do something before request is sent
        wavePulseAgent && wavePulseAgent.notify(EVENTS.SERVICE.BEFORE_CALL, 'event', [config]);
        return config;
    }, function (error: any) {
        // Do something with request error
        return Promise.reject(error);
    });
    
    // Add a response interceptor
    _axios.interceptors.response.use(function (response: any) {
        // Any status code that lie within the range of 2xx cause this function to trigger
        // Do something with response data
        response.config.__endTime = Date.now();
        wavePulseAgent && wavePulseAgent.notify(EVENTS.SERVICE.AFTER_CALL, 'event', [response.config, response]);
        if (!response.config.__wmVariable) {
            const config = response.config;
            wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
                name: 'NETWORK_REQUEST',
                data: {
                    url: config.url,
                    method: config.method
                },
                startTime: config.__startTime,
                endTime: config.__endTime
            }]);
        }
        return response;
    }, function (error: any) {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        // Do something with response error
        error.config.__endTime = Date.now();
        wavePulseAgent && wavePulseAgent.notify(EVENTS.SERVICE.AFTER_CALL, 'event', [error.config, error]);
        if (!error.config.__wmVariable) {
            const config = error.config;
            wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
                name: 'NETWORK_REQUEST',
                data: {
                    url: config.url,
                    method: config.method
                },
                startTime: config.__startTime,
                endTime: config.__endTime
            }]);
        }
        return Promise.reject(error);
    });
}

function buildComponentTree(componentNode: any) {
    return {
        tagName: componentNode.instance.props.cname || componentNode.instance.constructor.name,
        name: componentNode.instance.props.name,
        id: componentNode.id,
        children: componentNode.children.map((c: any) => buildComponentTree(c))
    }
}

function getComponentTree() {
    const pageIns: any = Object.values(currentPage.Widgets)
        .map((w: any) => w.componentNode)
        .find((w: any) => w?.instance?.props?.cname === 'WmPage');
    return pageIns && buildComponentTree(pageIns);
}

function getComponentById(id: string) {
    return (Object.values(currentPage.Widgets)
        .find((w: any) => w.componentNode.id === id) as any);
}

function bindCalls() {
    let lastHighLightedWidgetId = '';
    wavePulseAgent.onInvoke(CALLS.WIDGET.GET, (args) => {
        const name = args[0].name;
        return Promise.resolve(currentPage?.Widgets[name]);
    });
    wavePulseAgent.onInvoke(CALLS.WIDGET.HIGHLIGHT, (args) => {
        const lw = getComponentById(lastHighLightedWidgetId);
        lw?.setState({
            highlight: false
        });
        const widgetIdToHighlight = args[0];
        const w = getComponentById(widgetIdToHighlight);
        w?.setState({
            highlight: true
        });
        lastHighLightedWidgetId = widgetIdToHighlight;
        return Promise.resolve('');
    });
    wavePulseAgent.onInvoke(CALLS.WIDGET.GET_PROPERTIES_N_STYLES, (args) => {
        const widgetId = args[0];
        const w = getComponentById(widgetId);
        const ins = w.componentNode.instance;
        const styles = JSON.parse(JSON.stringify(ins.styles));
        const pp = ins.propertyProvider;
        const properties = Object.keys(pp.oldProps)
            .map(k => [k, pp.overriddenProps[k] || pp.oldProps[k]])
            .filter(([k, v]) => v !== undefined && v !== null && (typeof v !== 'object' || typeof v === 'string'))
            .reduce((r: any, c) => {
                r[c[0]] = c[1];
                return r;
            }, {});
        return Promise.resolve({styles, properties});
    });
    wavePulseAgent.onInvoke(CALLS.HANDSHAKE.WISH, (args) => {
        setTimeout(() => {
            (wavePulseAgent as any).isConnected = true;
            (wavePulseAgent as any).processBuffer();
        }, 2000);
        return Promise.resolve('Hello');
    });
    wavePulseAgent.onInvoke(CALLS.EXPRESSION.EVAL, (args) => {
        const expr = args[0].expr;
        if (expr) {
            return new Promise((resolve, reject) => {
                try {
                    const App = handler;
                    const Page = currentPage;
                    resolve(eval(expr));
                } catch(e) {
                    reject(JSON.stringify(e))
                }
            });
        }
        return Promise.resolve();
    });
    wavePulseAgent.onInvoke(CALLS.UI.REFRESH, () => {
        return Promise.resolve(currentPage?.refresh());
    });
    wavePulseAgent.onInvoke(CALLS.APP.INFO, async (): Promise<AppInfo> => {
        const appConfig = (handler as any).appConfig;
        const App = (handler as any);
        return {
            name: appConfig.appProperties.displayName,
            applicationId: appConfig.appId,
            version: appConfig.appProperties.version,
            description: '',
            icon: '',
            defaultLocale: appConfig.appProperties.defaultLanguage,
            selectedLocale: App.getSelectedLocale(),
            defaultTheme: appConfig.appProperties.activeTheme,
            activeTheme: App.activeTheme,
            activeLandingPage: appConfig.landingPage,
            defaultLandingPage: appConfig.appProperties.homePage,
            securityEnabled: appConfig.appProperties.securityEnabled,
            serverPath: appConfig.url
        };
    });
    wavePulseAgent.onInvoke(CALLS.STORAGE.GET_ALL, async (): Promise<any> => {
        const App = (handler as any);
        const o = await App.getDependency('StorageService').getAll();
        return o;
    });
    wavePulseAgent.onInvoke(CALLS.PLATFORM.INFO, async (): Promise<PlatformInfo> => {
        const { Platform } = require('react-native');
        return {
            os: Platform.OS,
            version: Platform.version + '',
            device: ''
        };
    });
    wavePulseAgent.onInvoke(CALLS.WIDGET.TREE, (args) => {
        let result = null as any;
        try {
            result = getComponentTree();
        } catch(e) {
            console.error((e as any).stack.toString());
        }
        return Promise.resolve(result);
    });
}

wrapConsole();
listenServiceCalls();

export const createWavePulseAgent = (args: {
    handler: Handler,
    agent?: Agent}) => {
    handler = args.handler;
    if (args.agent) {
        wavePulseAgent = args.agent
    } else {
        handler.subscribe('appReady', (p: any) => {    
            wavePulseAgent && wavePulseAgent.notify(EVENTS.TIMELINE.EVENT, 'event', [{
                name: 'APP_STARTUP',
                startTime: (handler as any).appConfig.diagnostics.appStartTime,
                endTime: (handler as any).appConfig.diagnostics.appReadyTime
            }]);
        });
    }
    listenPageEvents();
    listenVariableEvents();
    bindCalls();
    return wavePulseAgent;
};
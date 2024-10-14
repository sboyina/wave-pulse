"use client";
import { AppInfo, NetworkRequest, LogInfo, PlatformInfo, TimelineEvent } from "@wavemaker/wavepulse-agent/src/types";
import { UIAgent } from "@/wavepulse/ui-agent";
import { CALLS, EVENTS } from "@wavemaker/wavepulse-agent/src/constants";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const UIAgentContext = createContext<UIAgent>(null as any);

export const useLocation = () => {
    const [location, setLocation] = useState(null as any);
    useEffect(() => {
        setLocation(window && window.location);
    }, []);
    return location;
};

export const useLocalStorage = () => {
    const [localStorage, setLocalStorage] = useState(null as any);
    useEffect(() => {
        setLocalStorage(window && window.localStorage);
    }, []);
    return localStorage;
};

export const useConsole = () => {
    const uiAgent = useContext(UIAgentContext);
    const [logs, setLogs] = useState([] as LogInfo[]);
    const clearLogs = useCallback(() => {
        setLogs([]);
    }, [logs]);
    useEffect(() => {
        setLogs(uiAgent.sessionData.logs || []);
    }, [uiAgent.sessionData]);
    useEffect(() => {
        const destroy = uiAgent.subscribe(EVENTS.CONSOLE.LOG, (args) => {
            const logInfo = args[0] as LogInfo;
            setLogs(logs => [...logs, {...logInfo}]);
        });
        return destroy;
    }, []);
    useEffect(() => {
        uiAgent.currentSessionData.logs = logs;
        (window as any).remoteEvaL = (expr: string) => {
            uiAgent.invoke(CALLS.EXPRESSION.EVAL, [{expr}]).then((data) => {
                console.log(`Eval: ${expr} => ${JSON.stringify(data)}`);
            });
        };
    }, [logs]);
    return {logs, clearLogs};
};

export const useAppInfo = () => {
    const uiAgent = useContext(UIAgentContext);
    const [appInfo, setAppInfo] = useState({} as AppInfo);
    useEffect(() => {
        setAppInfo(uiAgent.sessionData.appInfo || {});
    }, [uiAgent.sessionData]);
    useEffect(() => {
        uiAgent.invoke(CALLS.APP.INFO, [])
        .then((args: any) => {
            const appInfo = args as AppInfo;
            setAppInfo(appInfo);
        });
    }, []);
    useEffect(() => {
        uiAgent.currentSessionData.appInfo = appInfo;
    }, [appInfo]);
    return appInfo;
};

export const useStorageEntries = () => {
    const uiAgent = useContext(UIAgentContext);
    const [storage, setStorage] = useState({});
    const refreshStorage = useCallback(() => {
        uiAgent.invoke(CALLS.STORAGE.GET_ALL, [])
        .then((args: any) => {
            setStorage(args);
        });
    }, [storage]);
    useEffect(() => {
        setStorage(uiAgent.sessionData.storage || {});
    }, [uiAgent.sessionData]);
    useEffect(() => {
        refreshStorage();
    }, []);
    useEffect(() => {
        uiAgent.currentSessionData.storage = storage;
    }, [storage]);
    return {storage, refreshStorage};
};

export const usePlatformInfo = () => {
    const uiAgent = useContext(UIAgentContext);
    const [platformInfo, setPlatformInfo] = useState({} as PlatformInfo);
    useEffect(() => {
        setPlatformInfo(uiAgent.sessionData.platformInfo || {});
    }, [uiAgent.sessionData]);
    useEffect(() => {
        uiAgent.invoke(CALLS.PLATFORM.INFO, [])
        .then((args: any) => {
            const platformInfo = args as PlatformInfo;
            setPlatformInfo(platformInfo);
        });
    }, []);
    useEffect(() => {
        uiAgent.currentSessionData.platformInfo = platformInfo;
    }, [platformInfo]);
    return platformInfo;
};

export const useVariables = () => {
    const uiAgent = useContext(UIAgentContext);
    const [variables, setVariables] = useState([] as any[]);
    useEffect(() => {
        setVariables(uiAgent.sessionData.variables || []);
    }, [uiAgent.sessionData]);
    const clearVariables = useCallback(() => {
        setVariables([]);
    }, [variables])
    useEffect(() => {
        const destroy = uiAgent.subscribe(EVENTS.VARIABLE.AFTER_INVOKE, (args) => {
            const variable = args[0] as any;
            setVariables(variables => [...variables, {...variable}]);
        });
        return destroy;
    }, []);
    useEffect(() => {
        uiAgent.currentSessionData.variables = variables;
    }, [variables]);
    return [variables, clearVariables];
};

export const useNetworkRequests = () => {
    const uiAgent = useContext(UIAgentContext);
    const [requests, setRequests] = useState([] as NetworkRequest[]);
    useEffect(() => {
        setRequests(uiAgent.sessionData.requests || []);
    }, [uiAgent.sessionData]);
    const clearRequests = useCallback(() => {
        setRequests([]);
    }, [requests]);
    useEffect(() => {
        const destroy = uiAgent.subscribe(EVENTS.SERVICE.AFTER_CALL, ([req, res]) => {
            const request = {
                id: Date.now() + '',
                name: req.url?.split('?')[0].split('/').findLast((s: string) => s),
                path: req.url,
                method: req.method,
                status: res.status,
                time: ((req.__endTime || 0) - (req.__startTime || 0)),
                req: req,
                res: res
            } as NetworkRequest;
            setRequests((requests) => [...requests, {...request}]);
        });
        return destroy;
    }, [requests]);
    useEffect(() => {
        uiAgent.currentSessionData.requests = requests;
    }, [requests]);
    return {requests, clearRequests};
};

export const useComponentTree = () => {
    const uiAgent = useContext(UIAgentContext);
    const [componentTree, setComponentTree] = useState(null as any);
    useEffect(() => {
        setComponentTree(uiAgent.sessionData.componentTree || null);
    }, [uiAgent.sessionData]);
    const highlight = useCallback((widetId: string) => {
        uiAgent.invoke(CALLS.WIDGET.HIGHLIGHT, [widetId]);
    }, []);
    const refreshComponentTree = useCallback(() => {
        uiAgent.invoke(CALLS.WIDGET.TREE, []).then((data) => {
            setComponentTree(data);
        });
    }, []);
    useEffect(() => {
        const destroy =  uiAgent.subscribe(EVENTS.TIMELINE.EVENT, (args) => {
            const logInfo = args[0] as TimelineEvent<any>;
            if (logInfo.name === 'PAGE_READY') {
                refreshComponentTree();
            }
        });
        return destroy;
    }, [refreshComponentTree]);
    useEffect(refreshComponentTree, []);
    useEffect(() => {
        uiAgent.currentSessionData.componentTree = componentTree;
    }, [componentTree]);
    return {componentTree, refreshComponentTree, highlight};
};

export const useTimelineLog = () => {
    const uiAgent = useContext(UIAgentContext);
    const [timelineLogs, setTimelineLogs] = useState([] as TimelineEvent<any>[]);
    const clearTimelineLogs = useCallback(() => {
        setTimelineLogs([]);
    }, [timelineLogs]);
    const startProfile = useCallback(() => {
        const destroy =  uiAgent.subscribe(EVENTS.TIMELINE.EVENT, (args) => {
            const logInfo = args[0] as TimelineEvent<any>;
            setTimelineLogs(timelineLogs => {
                const newVal = [...timelineLogs];
                const i = newVal.findIndex(v => {
                    return v.startTime > logInfo.startTime;
                });
                if (i < 0) {
                    newVal.push(logInfo);
                } else {
                    newVal.splice(i, 0, logInfo);
                }
                return newVal;
            });
        });
        return destroy;
    }, [uiAgent]);
    useEffect(() => {
        return startProfile();
    }, [])
    useEffect(() => {
        setTimelineLogs(uiAgent.sessionData.timelineLogs || []);
    }, [uiAgent.sessionData]);
    useEffect(() => {
        uiAgent.currentSessionData.timelineLogs = timelineLogs;
    }, [timelineLogs]);
    return {timelineLogs, clearTimelineLogs, startProfile};
};
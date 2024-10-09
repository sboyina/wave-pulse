"use client";

import { UIAgentContext, useAppInfo, useComponentTree, useConsole, useNetworkRequests, usePlatformInfo, useStorageEntries, useTimelineLog } from "@/hooks/hooks";
import { Tabs, Tab, Card, CardBody, Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useContext, useState, useEffect , useMemo, useCallback} from "react";
import { Info } from "./info";
import { Network } from "./network";
import { Console } from "./console";
import { Storage } from "./storage";
import { SaveDataIcon, SolarSettingsBoldIcon } from "@/components/icons";
import { Settings } from "./settings";
import { SaveDataDialog } from "./savedata";
import { ElementTree } from "./element-tree";
import { WidgetNode } from "@wavemaker/wavepulse-agent/src/types";
import {BreadcrumbsComponent} from "@/components/breadcrumbs";
import { TimeLine } from "./timeline";

export default function PulsePage({ params }: { params: { section: string } } ) {

  const router = useRouter();
  const uiAgent = useContext(UIAgentContext);
  const appInfo = useAppInfo();
  const platformInfo = usePlatformInfo();
  const {requests, clearRequests} = useNetworkRequests();
  const {timelineLogs, clearTimelineLogs} = useTimelineLog();
  const entries = useStorageEntries();
  const {logs, clearLogs} = useConsole();
  const {componentTree, refreshComponentTree, highlight} = useComponentTree();
  const [isSettingsOpened, setIsSettingsOpen] = useState(false);
  const [isSaveDataOpened, setIsSaveDataOpen] = useState(false);
  const [selected, setSelected] = useState(params.section);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetNode>(null as any);
  const [breadcrumbData, setBreadcrumbData]=useState<WidgetNode[]>();    //should get props.path into this page


  useEffect(() => {
    uiAgent.onConnect(() => {
      setIsConnected(uiAgent.isConnected);
    });
  }, []);
  useEffect(() => {
    setIsConnected(!!uiAgent.sessionDataKey);
  }, [uiAgent.sessionDataKey]);
  useEffect(() => {
    history.pushState(null, null as any, `./${selected}`);
  }, [selected]);
  const onselectBreadCrumbCallback = useCallback((props:any) => {
   setSelectedWidget(props);
  },[])
  return (
    <div className="w-full h-full flex flex-col">
      {isConnected ? 
        (<Tabs aria-label="Options" radius="none" variant="underlined" classNames={{
          base: 'w-full flex debug-panel-tabs-list',
          tabList: 'w-full bg-zinc-300 p-0 border-b-1',
          tab: 'w-auto',
          panel: 'p-0 overflow-auto debug-panel-tab-panel'
        }}       
        selectedKey={selected}
        onSelectionChange={(key) => setSelected(key as string)}>
          <Tab key="console" title="Console">
            <Console logs={logs} clear={clearLogs}></Console>
          </Tab>
          <Tab key="elements" title="Elements">
            <div className="h-full ">
              <ElementTree root={componentTree} refreshComponentTree={refreshComponentTree} isSelected={(n) => {
                return selectedWidget && n.id === selectedWidget.id}}  onSelect={(n,path) => {
                  setBreadcrumbData([...(path || []), n]);
                highlight(n.id);
              }} onHover={(n) => {
                highlight(n.id);
              }}
              ></ElementTree>  
            </div>
            <div  className={
                    "text-sky-800 cursor-pointer bg-slate-200 w-full fixed bottom-7"
                    }>{ <BreadcrumbsComponent data={breadcrumbData} onselectBreadCrumbCallback={onselectBreadCrumbCallback}/> }
            </div>
          </Tab>
          <Tab key="network" title="Network">
            <Network requests={requests}></Network>
          </Tab>
          <Tab key="timeline" title="Timeline">
            <TimeLine timelineLogs={timelineLogs} clearTimelineLogs={clearTimelineLogs}></TimeLine>
          </Tab>
          <Tab key="performance" title="Performance">
            Performance is under construction.
          </Tab>
          <Tab key="storage" title="Storage">
            <Storage data={entries}></Storage>
          </Tab>
          <Tab key="info" title="Info">
            <Info appInfo={appInfo} platformInfo={platformInfo}></Info> 
          </Tab>
        </Tabs>) : 
        null }
        {isConnected ? null : (
          <div className="flex flex-1 justify-center content-center  flex-wrap">
            <div className="lds-ripple"><div></div><div></div></div>
          </div>
        )}
      <SaveDataDialog isOpen={isSaveDataOpened} onClose={() => setIsSaveDataOpen(false)}></SaveDataDialog>
      <Settings isOpen={isSettingsOpened} onClose={() => setIsSettingsOpen(false)}></Settings>
      <div className="bg-zinc-100 py-1 px-8 w-full flex flex-row justify-between content-center border-t-2 border-zinc-300">
        <div className="flex flex-row content-center">
          <span className={'text-xs font-bold ' + (uiAgent.isConnected || uiAgent.sessionDataKey ? '' : 'text-red-500')}>
            {uiAgent.isConnected ? 'Connected to device' : (uiAgent.sessionDataKey ? 'Data loaded from : ' + uiAgent.sessionDataKey : 'Waiting for connection...')}
          </span>
        </div>
        <div className="flex flex-row content-center">
          {uiAgent.isConnected ? (<div className="align-end cursor-pointer mr-4" onClick={() => {
            setIsSaveDataOpen(true);
          }}>
            <SaveDataIcon color="#666" width={20} height={20}></SaveDataIcon>
          </div>) : null }
          <div className="align-end cursor-pointer" onClick={() => {
            setIsSettingsOpen(true);
          }}>
            <SolarSettingsBoldIcon color="#666" width={20} height={20}></SolarSettingsBoldIcon>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { UIAgentContext, useAppInfo, useComponentTree, useConsole, useNetworkRequests, usePlatformInfo, useStorageEntries, useTimelineLog } from "@/hooks/hooks";
import { Tabs, Tab, Button, Input, DropdownMenu, DropdownItem, Dropdown, DropdownTrigger, ButtonGroup } from "@nextui-org/react";
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
import {Session} from './session';
import QRCode from "react-qr-code";
import { ChevronDownIcon } from "@nextui-org/shared-icons";

const connectOptions = {
  mobile: {
    label: 'Connect to APK or IPA',
    description: 'Connect to a WaveMaker React Native APK or IPA.'
  },
  webpreview: {
    label: 'Connect to Web Preview',
    description: 'Connect to a WaveMaker React Native web preview.'
  }
};

export default function PulsePage({ params }: { params: { section: string } } ) {

  const router = useRouter();
  const uiAgent = useContext(UIAgentContext);
  const appInfo = useAppInfo();
  const platformInfo = usePlatformInfo();
  const {requests, clearRequests} = useNetworkRequests();
  const {timelineLogs, clearTimelineLogs} = useTimelineLog();
  const {storage, refreshStorage} = useStorageEntries();
  const {logs, clearLogs} = useConsole();
  const {componentTree, refreshComponentTree, highlight} = useComponentTree();
  const [isSettingsOpened, setIsSettingsOpen] = useState(false);
  const [isSaveDataOpened, setIsSaveDataOpen] = useState(false);
  const [selected, setSelected] = useState(params.section);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetNode>(null as any);
  const [breadcrumbData, setBreadcrumbData]=useState<WidgetNode[]>();
  //should get props.path into this page
  const [sessionDataArr, setSessionDataArr] = useState([]);
  const [appId, setAppId] = useState(localStorage.getItem('wavepulse.lastopenedapp.id') || 'com.application.id');   //should get props.path into this page
  const [url, setUrl] = useState('');
  const [selectedConnectOption, setSelectedConnectOption] = useState(['mobile']);
  useEffect(() => {
    appId && uiAgent.getWavepulseUrl(appId).then(url => setUrl(url));
    localStorage.setItem('wavepulse.lastopenedapp.id', appId);
  }, [appId]);

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

  //here
  useEffect(() => {
    uiAgent.listSessionData().then((data) => {
        setSessionDataArr(data);
    });
}, []);

// console.log('sessiondataarray', sessionDataArr);
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
          {/* <Tab key="performance" title="Performance">
            Performance is under construction.
          </Tab> */}
          <Tab key="storage" title="Storage">
            <Storage data={storage} refreshStorage={refreshStorage}></Storage>
          </Tab>
          <Tab key="info" title="Info">
            <Info appInfo={appInfo} platformInfo={platformInfo}></Info> 
          </Tab>
          <Tab key="session" title="Session">
            <Session sessionData={sessionDataArr}></Session>
          </Tab>
        </Tabs>) : 
        null }
        {isConnected ? null : (
          <div 
            className="flex flex-1 flex-col justify-center content-center items-center flex-wrap">
            <div className="lds-ripple"><div></div><div></div></div>
                <ButtonGroup>
                  <Button 
                    style={{width: 360}}
                    variant="bordered">
                      {(connectOptions as any)[selectedConnectOption[0]].label}
                  </Button>
                <Dropdown>
                  <DropdownTrigger>
                      <Button isIconOnly>
                        <ChevronDownIcon />
                      </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    selectedKeys={selectedConnectOption}
                    selectionMode="single"
                    className="max-w-[300px]"
                    onSelectionChange={(keys) => {
                      setSelectedConnectOption([keys.currentKey || '']);
                    }}
                  >
                  <DropdownItem key="mobile" description={connectOptions.mobile.description}>
                    {connectOptions.mobile.label}
                  </DropdownItem>
                  <DropdownItem key="webpreview" description={connectOptions.webpreview.description}>
                    {connectOptions.webpreview.label}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </ButtonGroup>
            {
              selectedConnectOption[0] === 'mobile' ? (<div style={{minHeight: 600}}
                className="flex flex-col content-center items-center flex-wrap">
                <div className="p-2 text-sm" style={{width: 400}}>
                  <div className="text-sm text-gray-400 ">{"1) Enter the Application Id below. Application Id is available in Export React Zip dialog in Studio."}</div>
                </div>
                <div className="p-2" style={{width: 400}}>
                  <Input type="text" defaultValue={appId} className="w-full" placeholder="Ex: com.application.id" onChange={(event) => setAppId(event.target.value)}/>
                </div>
                <div className="p-2 text-sm" style={{width: 400}}>
                  <div className="text-sm text-gray-400">{"2) Using your phone, scan the below QR code, which contains url."}</div>
                </div>
                <div className="p-2">
                  <QRCode value={url || ''}/>
                </div>
                <div className="p-2">
                  <a className="text-sm break-all w-full underline text-center" href={url}>Copy this link</a>
                </div>
                <div className="p-2" style={{width: 400}}>
                  <div className="text-sm text-gray-400">{"3) When the url is opened in phone web browser, App that has the above application id will be opened."}</div>
                </div>
                {/* <div className="p-2" style={{width: 400}}>
                  <div className="text-sm">{"4) Message is shown when the app is connected to WavePulse."}</div>
                </div> */}
              </div>) : null
            }
            {
              selectedConnectOption[0] === 'webpreview' ? (<div style={{minHeight: 600}} 
                className="flex flex-col content-center items-center flex-wrap">
                <div className="p-2 text-sm" style={{width: 400}}>
                  <div className="text-sm text-gray-400 ">{"1) In the browser tab where app is running, open developer console."}</div>
                </div>
                <div className="p-2 text-sm" style={{width: 400}}>
                  <div className="text-sm text-gray-400">{"2) Execute the below code in the developer console."}</div>
                </div>
                <pre className="text-black text-sm">{`wm.App.tryToconnectWavepulse('${location.origin}');`}</pre>
              </div>) : null
            }
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
          {uiAgent.isConnected ? (
            <div className="align-end cursor-pointer mr-4" onClick={() => {
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

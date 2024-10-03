import React from "react";
import { KeyValuePair, KeyValueProps } from "@/components/key-pair";
import { Accordion, AccordionItem, Button, Tab, Table, Tabs } from "@nextui-org/react";
import { CloseIcon } from "@nextui-org/shared-icons";
import { NetworkRequest } from "@wavemaker/wavepulse-agent/src/types";
import { useEffect, useState } from "react";
import {Search} from '@/components/search'
import {DropdownComponent} from '@/components/dropdown'

const logColors = {
    get: 'text-green-600 bg-green-200  border-green-600',
    put: 'text-orange-600 bg-orange-200  border-orange-600',
    post: 'text-orange-600 bg-orange-200  border-orange-600',
    delete: 'text-red-600 bg-red-200  border-red-600',
    // 'N' : 'text-blue-600 bg-blue-200  border-blue-600'
} as any;

export type Props = {
    requests: NetworkRequest[]
};

const GeneralHeaders = [
    {
        key: 'url',
        label: 'Request URL'
    }, {
        key: 'method',
        label: 'Method'
    }, {
        key: 'status',
        label: 'Status'
    }
];

const Header = (props: {
    request: NetworkRequest
}) => {
    const [generalHeaders, setGeneralHeaders] = useState<KeyValueProps>();
    const [responseHeaders, setResponseHeaders] = useState<KeyValueProps>();
    const [requestHeaders, setRequestHeaders] = useState<KeyValueProps>();

    useEffect(() => {
        setGeneralHeaders({
            entries: GeneralHeaders.map(h => {
                return {
                    key: h.label,
                    value: (props.request?.req as any)[h.key] || (props.request?.res as any)[h.key]
                }
            }).filter(e => !!e.value)
        });
        setResponseHeaders({
            entries: Object.entries(props.request?.res.headers)
                .map(e => ({key: e[0], value: e[1] }))
        });
        setRequestHeaders({
            entries: Object.entries(props.request?.req.headers || {})
                .map(e => ({key: e[0], value: e[1] }))
        });
    }, [props.request]);
    return (
        <Accordion selectionMode="multiple" 
            isCompact 
            defaultExpandedKeys={["general", "response", "request"]}
            variant="splitted"
            itemClasses={{
                base: 'bg-transparent p-0',
                title: 'text-sm',
                heading: 'border-b'
            }}>
            <AccordionItem key="general" title="General" className="bg-transparent shadow-none text-xs my-4">
                {generalHeaders ? (<KeyValuePair {...generalHeaders}/>) : null}
            </AccordionItem>
            <AccordionItem key="response" title="Response" className="bg-transparent shadow-none  text-xs my-4">
                {responseHeaders ? (<KeyValuePair {...responseHeaders}/>) : null}
            </AccordionItem>
            <AccordionItem key="request" title="Request" className="bg-transparent shadow-none  text-xs my-4">
                {requestHeaders ? (<KeyValuePair {...requestHeaders}/>) : null}
            </AccordionItem>
        </Accordion>
    );
};



export const Network = (props: Props) => {
    const [selectedReq, setSelectedReq] = useState<NetworkRequest>(null as any);
    const [payload, setPayload] = useState<KeyValueProps>();
    const [response, setResponse] = useState('');

    //dropdown and search
    const allOptions: any = ["get", "put", "post", "delete", "all"]; //dropdown
    const [selectedKeys, setSelectedKeys] = useState(new Set(allOptions));
    const [filteredOptions, setFilterdOptions] = useState(allOptions);
    const [searchTerm, setSearchTerm] = useState("");   //search

    const onSearchChangeCallback = (value:string) => {
        setSearchTerm(value);
    }
    const onSelectionChangecallBack = (value:any) => {
        setSelectedKeys(value)
    }
    const selectedValue = React.useMemo(
        () => {
            if(selectedKeys.size === allOptions.length)
            {
              return ['All']
            }
            else if(selectedKeys.size > 1 && selectedKeys.size != allOptions.length){
              return ['Custom Levels']
            }
            else if(selectedKeys.has('hide all'))
            {
              selectedKeys.clear()
              return ['Hide All']
            }
            return Array.from(selectedKeys).join(", ").replaceAll("_", " ")
          }
      ,
        [selectedKeys]
    );
    const itemonPressCallback = (option: string) => {
        const options = [...filteredOptions];
        let updatedOptions = [];
    
        if (filteredOptions.includes(option)) {
          if (option !== "all") 
          {
            updatedOptions = options.filter(
              (i: string) => i != "all" && i != option
            );
          }
          else
          {
            updatedOptions = options.filter((i: string) => false);
          }
          setFilterdOptions(updatedOptions);
          option !== "all" && updatedOptions.length >= 1
            ? setSelectedKeys(new Set(updatedOptions))
            : setSelectedKeys(new Set(["hide all"]));
        }
        else
        {
          if (option === "all") {
            let updatedOptions = allOptions.filter((d: string) => true);
            setFilterdOptions(updatedOptions);
            setSelectedKeys(new Set(updatedOptions));
          } else {
            options.push(option);
            setFilterdOptions(options);
          }
        }
      };
    const searchConditionCallback =(log:any) => {
        return searchTerm === ""
        ? true
        : typeof log.name === "string" 
          ? log.name
              .toLowerCase()
              ?.includes(searchTerm.toLowerCase()) 
          : false;
    } 
    useEffect(() => {
        if (!selectedReq) {
            setPayload(null as any);
            return;
        }
        const contentType = selectedReq.req.headers?.["Content-Type"];
        if (contentType ===  "application/x-www-form-urlencoded") {
            const data = selectedReq.req.data;
            if (data) {
                setPayload({
                    entries: (data as string).split('&')
                        .map(s => s.split('=')
                        .reduce((p, c, i) => {
                            p[i ? 'value' : 'key'] = decodeURIComponent(c); 
                            return p;
                    }, {key: '', value: ''}))
                });
            }
        } else if (contentType ===  "application/json") {

        } else {
            setPayload(null as any);
        }
    }, [selectedReq]);
    useEffect(() => {
        if (!selectedReq) {
            setResponse(null as any);
            return;
        }
        const resContentType = selectedReq.res.headers["content-type"] as string;
        if (resContentType?.indexOf('application/json') >= 0) {
            const data = selectedReq.res.data;
            if (typeof data === 'string') {
                setResponse(JSON.stringify(JSON.parse(selectedReq.res.data || '{}'), null, 4))
            } else {
                setResponse(JSON.stringify(data, null, 4))
            }
            
        } else if (resContentType?.indexOf('text/') >= 0
            || resContentType?.indexOf('application/javascript') >= 0) {
            setResponse(selectedReq.res.data);
        } else {
            setResponse('');
        }
    }, [selectedReq]);
    const startTime = ((props.requests[0]?.req as any)?.__startTime || 0);
    const endTime = ((props.requests[props.requests.length - 1]?.req as any)?.__endTime) || 0;
    const totalTime = endTime - startTime;
    return (
        <div className="w-full h-full flex flex-row relative">
            <div className="flex-1 overflow-x-hidden h-full overflow-y-auto ">
               
                <div className=" bg-zinc-100 px-4 py-1 flex flex-row content-center sticky top-0 w-full ">
        
                    <div className="flex flex-1 flex-col justify-center ">
                    <Search 
                        onSearchChange={onSearchChangeCallback}    
                        searchTerm={searchTerm}
                    />
                </div>

                <div className="flex flex-1 flex-wrap flex-row content-center justify-end">
                    <DropdownComponent allOptions={allOptions} 
                        itemonPressCallback={itemonPressCallback} 
                        onSelectionChangecallBack={onSelectionChangecallBack} 
                        selectedKeys={selectedKeys} 
                        selectedValue={selectedValue}
                    />
                </div>
            </div>

                <div className="flex flex-row border border-x-0 px-4 py-1 w-svw sticky top-0 bg-zinc-100">
                    <div className="flex-shrink-0 text-xs text-color w-2/12 font-bold">Name</div>
                    <div className="flex-shrink-0 px-8 text-xs w-1/12 font-bold">Method</div>
                    <div className="flex-shrink-0 px-8 text-xs w-1/12 font-bold">Status</div>
                    <div className="flex-shrink-0 px-8 text-xs w-1/12 font-bold">Time</div>
                    <div className="px-8 text-xs w-7/12 font-bold">Waterfall</div>
                </div>
              
            {
                
                props.requests.map((r, i) => {
                    const mx = Math.round(((r.req as any).__startTime - startTime) / totalTime * 100);
                    const w = Math.round(((r.req as any).__endTime - (r.req as any).__startTime) / totalTime * 100);
                    return filteredOptions.includes(r.method) && searchConditionCallback(r) ? (
                        <div key={`${r.path}-${r.id}`} 
                            onClick={() => {
                                setSelectedReq(r);
                            }} 
                            className={
                                "flex flex-row w-svw border border-x-0 border-t-0 px-4 py-1 cursor-pointer hover:bg-zinc-50 " 
                                + (r === selectedReq ? 'bg-zinc-100' : '' )
                            }>
                            <div className="flex-shrink-0 text-xs text-color w-2/12">{r.name}</div>
                            <div className={"flex-shrink-0 px-0 text-xs w-1/12 text-center border rounded-lg " + (logColors[r.method] || '')}>
                            <span>{r.method.toUpperCase()}</span></div>
                            <div className="flex-shrink-0 px-8 text-xs w-1/12">{r.status}</div>
                            <div className="flex-shrink-0 px-8 text-xs w-1/12">{r.time}</div>
                            <div className="px-8 text-xs w-7/12">
                                <div className={"h-4 text-center border  " + (logColors[r.method] || '')} style={{
                                    marginLeft: mx + '%',
                                    width: w ? w + '%' : '2px'
                                }}></div>
                            </div>
                        </div>
                    )  : (<></>);
                })
            }
            </div>
            {selectedReq ? 
                (<div className="w-8/12 h-full border-t-1 border-l-1 relative">
                    <Tabs aria-label="Options" radius="none" variant="underlined" classNames={{
                        base: 'w-full flex',
                        tabList: 'bg-zinc-100 w-full p-0 border-b-1 text-sm nr-panel-tabs-list',
                        tab: 'w-auto',
                        panel: 'p-0 nr-panel-tab-panel overflow-auto bg-zinc-50'
                    }} >
                        <Tab key="headers" title="Headers">
                            <Header request={selectedReq}/>
                        </Tab>
                        {payload ? (
                            <Tab key="payload" title="Payload">
                                <KeyValuePair {...payload}/> 
                            </Tab>) : null
                        }
                        <Tab key="response" title="Response">
                            <pre className="text-xs p-4">{response}</pre>  
                        </Tab>
                    </Tabs>
                    <Button isIconOnly 
                        className="absolute top-0 right-0 bg-transparent w-8 h-8"
                        onClick={() => {
                            setSelectedReq(null as any);
                        }}>
                        <CloseIcon />
                    </Button>  
                </div>) : null}
        </div>
    );
};
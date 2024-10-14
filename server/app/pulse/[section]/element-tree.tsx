import { IconBxsDownArrow, IconBxsLeftArrow, RefreshIcon } from "@/components/icons";
import { Accordion, AccordionItem, Button, Select, SelectItem, Tab, Tabs } from "@nextui-org/react";
import { CALLS } from "@wavemaker/wavepulse-agent/src/constants";
import { WidgetNode } from "@wavemaker/wavepulse-agent/src/types";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UIAgentContext, useAppInfo, useComponentTree, useConsole, useNetworkRequests, usePlatformInfo, useStorageEntries } from "@/hooks/hooks";
import { DeleteIcon } from "@nextui-org/shared-icons";


export type Props = {
    root: WidgetNode,
    isSelected?: (n : WidgetNode) => boolean,
    depth?: number,
    path?: WidgetNode[],
    onSelect?: (node: WidgetNode,path?:WidgetNode[]) => void,
    onHover?: (node: WidgetNode) => void,
    isRoot?: boolean;
    refreshComponentTree?: Function;
};

let lastSelectedComponent: Function = null as any;

export const ComponentNode = (props: Props) => {
    const e = props.root;
    const [collapse, setCollapse] = useState(false);
    const [selected, setSelected] = useState(e.selected);
    const toggle = useCallback(() => {
        setCollapse(e.children?.length > 0 && !collapse);
    }, [e, collapse]);
    const onSelect = useCallback(() => {
        props.onSelect && props.onSelect(e,props.path);
        // setSelected(!selected);
    }, [e, props.path,props.onSelect, selected, setSelected]);
    const onHover = useCallback((event: any) => {
        event.stopPropagation();
        props.onHover && props.onHover(e);
    }, [e]);
    useEffect(() => {
        const isSelected = !!(props.isSelected && props.isSelected(e));

        setSelected((oldValue) => {
            if (!oldValue && isSelected) {
                onSelect();
            }
            return isSelected
        });
    }, [!!props.isSelected && props.isSelected(e), onSelect])
    useEffect(() => {
        if (selected) {
            lastSelectedComponent && lastSelectedComponent();
            lastSelectedComponent = () => {
                setSelected(false);
            };
        }
    }, [selected]);
    useEffect(() => {
        setTimeout(() => {
            e?.id && props.isRoot && onSelect();
        }, 100);
    }, [e && e.id && props.isRoot]);
    // useEffect(() => {
    //     e.selected = selected;
    // }, [e, selected, setSelected]);
    const depth = props.depth || 0;
    const hasChildren = e.children && e.children.length > 0;
    return e ? (

                <div key={e.id + '' + (!!e.selected)} className="text-xs flex flex-col" >
                    <div 
                    className={
                            "text-sky-800 cursor-pointer hover:bg-slate-200 flex flex-row align-middle " +
                            (selected ? 'bg-slate-300 hover:bg-slate-300': null)
                        }
                        style={{paddingLeft: depth + 'px'}} 
                        onClick={onSelect}
                        onMouseOver={onHover}>
                        {
                            hasChildren  ? (
                                <div style={{paddingTop: 4}} onClick={toggle}>
                                    {collapse ? (<IconBxsLeftArrow scale={10} color="#042f47"></IconBxsLeftArrow>) 
                                        : (<IconBxsDownArrow scale={10} color="#042f4766"></IconBxsDownArrow>)}
                                </div>): null 
                        }
                        <span className="">{'<'}</span>
                        <span className="">{e.tagName}</span>
                        {e.name ? (
                            <>
                                <span className="text-sky-600 pl-2"> name=</span>
                                <span className="text-orange-600">{`"${e.name}"`}</span>
                            </>
                        ) : null}
                        <span className="">{ hasChildren && !collapse ? '>' : `>${collapse ? '...' : ''}</${e.tagName}>`}</span>
                    </div>
                    {hasChildren ? 
                        collapse? null : (<>
                            <div>
                                <>
                                    {
                                        e.children?.map((c) => (
                                        
                                            <ComponentNode root={c} 
                                                path={[...(props.path || []),e]} 
                                                isSelected={props.isSelected} 
                                                key={c.name} depth={depth + 16} 
                                                onSelect={props.onSelect}  
                                                onHover={props.onHover} ></ComponentNode>
                                        ))
                                    }
                                </>
                            </div>
                            <div className="text-sky-800 cursor-pointer hover:bg-slate-200" style={{paddingLeft: depth + 'px'}} >{`</${e.tagName}>`}</div>
                        </>) : null}
                </div>

    ): null;
};

export const ElementTree = (props: Props) => {
   
    const uiAgent = useContext(UIAgentContext);
    const [styles, setStyles] = useState({} as any);
    const [properties, setProperties] = useState([] as any);
    const [selectedPart, setSelectedPart] = useState('root');
    const onSelect = useCallback((n: WidgetNode,path:any) => {
        props.onSelect && props.onSelect(n,path);
        uiAgent.invoke(CALLS.WIDGET.GET_PROPERTIES_N_STYLES, [n.id]).then((data) => {
            setStyles(data.styles);
            setProperties(Object.keys(data.properties|| {}).sort().map(k => [k, data.properties[k]]));
            setSelectedPart('root');
        });
    }, [props.onSelect, uiAgent]);
    const onHover = useCallback((n: WidgetNode) => {
        props.onHover && props.onHover(n);
    }, [props.onHover]);
    return (
            <div className="flex flex-row h-full bottom-8">
                <div className="flex-1 h-full overflow-auto">
                    <div className=" bg-zinc-100 px-4 py-1 flex flex-row content-center sticky top-0 w-full ">
                    <div className="flex flex-1 flex-col justify-center "></div>
                    <div className="flex flex-1 flex-wrap flex-row content-center justify-end">
                        <Button
                            isIconOnly
                            className="bg-transparent w-8 h-6 float-right"
                            onClick={() => props.refreshComponentTree && props.refreshComponentTree()}
                        >
                            <RefreshIcon color="#bbb" scale={24}></RefreshIcon>
                        </Button>
                    </div>
                </div>
                    {props.root ? (<ComponentNode 
                        root={props.root} 
                        isSelected={props.isSelected} 
                        path={[]} 
                        depth={0} 
                        onSelect={onSelect} 
                        onHover={onHover}
                        isRoot={true}></ComponentNode>) : null}
                </div>        
                <div className="h-full bg-zinc-100" style={{width: 400}}>
                    <Tabs aria-label="Options" radius="none" variant="underlined" classNames={{
                        base: 'w-full flex',
                        tabList: 'bg-zinc-100 w-full p-0 border-b-1 text-sm',
                        tab: 'w-auto h-full',
                        panel: 'p-0 nr-panel-tab-panel overflow-auto bg-zinc-50'
                    }} >
                        <Tab key="styles" title="Styles" className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="p-1">
                                    <Select className="w-full"
                                        variant="flat"
                                        radius="none"
                                        selectedKeys={[selectedPart]}
                                        classNames={{
                                            base: 'bg-zinc-300'
                                        }}
                                        onSelectionChange={(s) => {
                                            setSelectedPart((s ? s.currentKey : '') || 'root');
                                        }}>
                                        {Object.keys(styles|| []).map((k) => (
                                            <SelectItem key={k}>
                                                {k}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {(styles[selectedPart])?.__trace.map((e: any) => {
                                        return (
                                            <Accordion key={e.name}
                                                defaultExpandedKeys={[e.name]}
                                                isCompact={true}>
                                                <AccordionItem key={e.name} title={e.name} classNames={{
                                                    heading: 'bg-zinc-200 px-1',
                                                    title: 'text-sm'
                                                }}>
                                                    {Object.keys(e.value || [])
                                                        .map((sname: any) => {
                                                            const svalue = e.value[sname];
                                                            return (
                                                            <div className="flex flex-rows p-1 border-b-1 last:border-b-0 overflow-hidden">
                                                                <div className="w-6/12 font-bold text-xs" title={sname}>
                                                                    {sname}
                                                                </div>
                                                                <div className="w-6/12 px-1 text-xs whitespace-nowrap" title={svalue + ''}>
                                                                    {svalue + ''}
                                                                </div>
                                                            </div>);
                                                    })}
                                                </AccordionItem>
                                            </Accordion>
                                        );
                                    })}
                                </div>
                            </div>
                        </Tab>
                        <Tab key="props" title="Properties" className="overflow-hidden">
                            {(properties || []).map((e: any) => {
                                return (
                                <div className="flex flex-rows p-1 border-b-1">
                                    <div className="w-6/12 font-bold text-xs" title={e[0]}>
                                        {e[0]}
                                    </div>
                                    <div className="w-6/12 px-1 text-xs whitespace-nowrap" title={e[1] + ''}>
                                        {e[1] + ''}
                                    </div>
                                </div>);
                            })}
                        </Tab>
                    </Tabs>
            </div>
        </div>
    );
};



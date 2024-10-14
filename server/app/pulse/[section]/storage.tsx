import React, { useEffect, useState } from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button} from "@nextui-org/react";

import { AppInfo, PlatformInfo } from "@wavemaker/wavepulse-agent/src/types";
import { KeyValuePair, KeyValueProps } from "@/components/key-pair";
import { RefreshIcon } from "@/components/icons";

export type Props = {
    data: any,
    refreshStorage: Function
};

export const Storage = (props: Props) => {
    const storage = props.data;
    const [storageProps, setStorageProps] = useState<KeyValueProps>(null as any);
    useEffect(() => {
        setStorageProps({
            entries: Object.entries(storage).map(e => ({
                key: e[0],
                value: e[1] as string || ''
            })) || []
        });
    }, [storage]);
    return (
        <div className="flex flex-col h-full bottom-8">
            <div className=" bg-zinc-100 px-4 py-1 flex flex-row content-center sticky top-0 w-full ">
                <div className="flex flex-1 flex-col justify-center "></div>
                <div className="flex flex-1 flex-wrap flex-row content-center justify-end">
                    <Button
                        isIconOnly
                        className="bg-transparent w-8 h-6 float-right"
                        onClick={() => props.refreshStorage && props.refreshStorage()}
                    >
                        <RefreshIcon color="#bbb" scale={24}></RefreshIcon>
                    </Button>
                </div>
            </div>
        { storageProps ? (<KeyValuePair {...storageProps}></KeyValuePair>) : null }
        </div>
    );
};
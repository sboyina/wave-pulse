import React, { useState, useCallback } from "react";
import { DeleteIcon } from "@nextui-org/shared-icons";
import {Button} from "@nextui-org/react";
import {Search} from '@/components/search'
import {DropdownComponent} from '@/components/dropdown'
import { LogInfo } from "@wavemaker/wavepulse-agent/src/types";

const logColors = {
  debug: "text-green-600",
  info: "text-light-blue",
  warn: "text-orange-600",
  error: "text-red-600",
} as any;

export const Choices = (props: {
  entries: {
    key: string;
    value: string;
  };
}) => {};

const getMessageStr = (message: any) => {
  if (message === undefined || message === null) {
    return "";
  }
  if (typeof message === "string") {
    return message;
  }
  return JSON.stringify(message);
};



export const Console = function (props: { logs: LogInfo[]; clear: Function }) {

  const allOptions: any = ["debug", "warn", "log", "error", "all"];

  const [selectedKeys, setSelectedKeys] = useState(new Set(allOptions));

  const [searchTerm, setSearchTerm] = useState("");

  const [filteredOptions, setFilterdOptions] = useState(allOptions);

  const onSelectionChangecallBack = useCallback((value:any) => {
    setSelectedKeys(value)
  },[filteredOptions])

  const onSearchChangeCallback = useCallback((value:string)=>{
    setSearchTerm(value);
  },[searchTerm])

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

    ,[selectedKeys]
  );

  const itemonPressCallback = useCallback((option: string) => {
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
  },[filteredOptions]);

  const searchConditionCallback =useCallback((log:any) => {
    return searchTerm === ""
    ? true
    : typeof log.message[0] === "string"
      ? log.message[0]
          .toLowerCase()
          ?.includes(searchTerm.toLowerCase()) ||
        new Date(log.date)
          .toLocaleString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : false;
} ,[searchTerm])

  return (
    <div>
    
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
          selectedKeys={selectedKeys} selectedValue={selectedValue}
          />
        </div>

        <div style={{ alignContent: "center" }}>
          <Button
            isIconOnly
            className="bg-transparent w-8 h-6 float-right"
            onClick={() => {
              props.clear();
            }}
          >
            <DeleteIcon></DeleteIcon>
          </Button>
        </div>
      </div>

      {props.logs.map((log, i) => {  
        return filteredOptions.includes(log.type) && searchConditionCallback(log) ? (
          <div
            key={`${(log.date, "_", i)}`}
            className="flex flex-col border border-x-0 border-t-0"
          >
            <div
              className={"flex flex-row w-full " + (logColors[log.type] || "")}
            >
              <div className="flex-shrink-0 text-xs text-color">
                {new Date(log.date).toLocaleString()}
              </div>
              <div className="px-8 text-xs">
              {getMessageStr(log.type)}
              </div>
              <div className="px-8 text-xs">
                {getMessageStr(log.message && log.message[0])}
              </div>
            </div>
          </div>
        ) : (
          <></>
        );
      })}
    </div>
  );
};


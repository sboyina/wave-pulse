import React, { useState, useCallback } from "react";
import { DeleteIcon } from "@nextui-org/shared-icons";
import {Button} from "@nextui-org/react";
import {Search} from '@/components/search';
import { SessionData } from "@wavemaker/wavepulse-agent/src/types";
import {IconExport} from '@/components/icons';
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import axios from 'axios';



export const Choices = (props: {
  entries: {
    key: string;
    value: string;
  };
}) => {};


export const Session =  function (props: { sessionData: SessionData[]}) {

  const [searchTerm, setSearchTerm] = useState("");
  const [sessionData, setSessionData] = useState(props.sessionData);

  const onSearchChangeCallback = useCallback((value:string)=>{
    setSearchTerm(value);
  },[searchTerm])

  const searchConditionCallback =useCallback((data:any) => {
    return searchTerm === ""
    ? true
    : typeof data === "string"
      ? data
          .toLowerCase()
          ?.includes(searchTerm.toLowerCase()) 
      : false;
} ,[searchTerm])

  const deletionCallBack = useCallback((index:number) => {
       if(index !==props.sessionData.length)
       {
        const val =  sessionData.filter((d,i)=>{
            return d !== sessionData[index]
            })
        setSessionData(val);
       }
       else{
        const val =  sessionData.filter((d,i)=>{
            return d === sessionData[index]
            })
        setSessionData(val);
       }
    },[sessionData ])

const fileExtractCallBack = async (fileName:any) => {
  try {
    const response = await axios.get(`/api/session/data/${fileName}`);
    if (response.status !== 200) {
      throw new Error('Failed to fetch file contents');
    }
    const fileContent = await response.data;
    var zip = new JSZip();
    zip.file(`${fileName}`, JSON.stringify(fileContent) );
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "example.zip");
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

  return (
    <div>
      <div className=" bg-zinc-100 px-4 py-1 flex flex-row content-center sticky top-0 w-full ">  
        <div className="flex flex-1 flex-col justify-center ">
        <Search 
            onSearchChange={onSearchChangeCallback}    
            searchTerm={searchTerm}
        />
        </div>
        <div style={{ alignContent: "center" }}>
          <Button
            isIconOnly
            className="bg-transparent w-8 h-6 float-right"
            onClick={()=>{deletionCallBack(props.sessionData.length)}}
          >
            <DeleteIcon></DeleteIcon>
          </Button>
        </div>
      </div>
            
      <div className="flex flex-row border border-x-0 px-4 py-1 w-svw sticky top-0 bg-zinc-100">
        <div className="flex-shrink-0 text-xs text-color w-3/12 font-bold">Name</div>
        <div className="flex-shrink-0 text-xs text-color w-1/12 font-bold">Export</div>
        <div className="flex-shrink-0 text-xs text-color w-1/12 font-bold">Delete</div>
      </div>

      {sessionData.map((data, index) => {  
        return  (
        searchConditionCallback(data) ?
            <div className={"flex flex-row w-svw border border-x-0 border-t-0 px-4 py-1 cursor-pointer hover:bg-zinc-50 "}>
                <div className="flex-shrink-0 text-xs text-color w-3/12">{data}</div>
                <div style={{ alignContent: "center" }} className="flex-shrink-0 text-xs text-color w-1/12 flex items-start">
                    <Button
                        isIconOnly
                        className="bg-transparent w-8 h-6 float-right"
                        onClick={() => 
                        
                            fileExtractCallBack(data)
                        }
                    >
                        <IconExport></IconExport>
                    </Button>
                </div>

                <div style={{ alignContent: "center" }} className="flex-shrink-0 text-xs text-color w-1/12 flex items-start">  
                    <Button
                        isIconOnly
                        className="bg-transparent w-8 h-6 float-right"
                        onClick={() => deletionCallBack(index)}
                    >
                        <DeleteIcon></DeleteIcon>
                    </Button>
                </div>
            </div>
        : (  <></>  )
      )})}
    </div>
  );
};




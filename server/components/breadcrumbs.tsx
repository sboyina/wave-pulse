import React, { useCallback, useEffect, useRef, useState } from "react";
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/react";

export const BreadcrumbsComponent = (props:any) => {
  const listRef = useRef(null);
  const firstEleRef = useRef(null);
  const lastEleRef = useRef(null);
  const [displayLeftIcon, setdisplayLeftIcon] = useState(false);
  const [displayRightIcon, setdisplayRightIcon] = useState(false);
  const [sliderUnits, setsliderUnits] = useState(0);

const onselectBreadCrumb = (data:any) => {
  props.onselectBreadCrumbCallback(data)
}

useEffect(()=>{
const updateWidth = () => {
  const firstRefRect = firstEleRef?.current?.getBoundingClientRect();
  const lastRefRect = lastEleRef?.current?.getBoundingClientRect();

  if(listRef?.current?.offsetWidth < lastRefRect?.x+lastRefRect?.width)
  {
    setdisplayLeftIcon(true)
  }
  else{
    setdisplayLeftIcon(false)
  }
  if(firstRefRect?.x <= 0)
  {
    setdisplayRightIcon(true)
  }
  else
  {
    setdisplayRightIcon(false)
  }
}

updateWidth();
window.addEventListener('resize', updateWidth);

},[firstEleRef.current, lastEleRef.current, sliderUnits,onselectBreadCrumb])

const moveLeft = useCallback(() => {
  setsliderUnits(sliderUnits-60);
},[sliderUnits])

const moveRight = useCallback(() => {
   setsliderUnits(sliderUnits+60) 
},[sliderUnits])


  return (
    <div className="flex flex-row "> 
      { displayLeftIcon ? <div className="bg-slate-300 flex flex-row justify-center items-center" onClick={moveLeft}>&lt;&lt;
      </div> : null}
    <Breadcrumbs underline={'none'} maxItems={20} classNames={{
      'base': 'px-8 py-1 flex flex-1',
      'list' : 'h-4 flex-nowrap'
    }}  
    style={{overflow:'hidden'}}
    ref={listRef}
    >
    
    { props?.data?.map((data:any, i:number) => {
          return  <BreadcrumbItem 
            classNames={{
              'item': 'text-xs'
            }}
            ref = {i===0 ? firstEleRef : i===props.data.length-1 ? lastEleRef : null}
            onPress={()=>onselectBreadCrumb(data)} 
            style={{transform: `translateX(${sliderUnits}px)`}}
          >{data.tagName}</BreadcrumbItem>
       })
      }
    </Breadcrumbs>
    {displayRightIcon ? <div className="bg-slate-300 flex flex-row justify-center items-center" onClick={moveRight}>&gt;&gt;</div>: null}
    </div>
  )
}



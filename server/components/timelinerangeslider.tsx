import React from 'react'  
import { set} from 'date-fns' 
import { TimeRange } from '@/components/timelinerangeslider/index' ;
import moment from 'moment';


interface TimelineRangeSliderProps {
  startTime: Date;
  endTime: Date;
  currentstartTime:Date;
  currentendTime:Date;
  searchCallBack:Function;
}


class TimelineRangeSlider extends React.Component<TimelineRangeSliderProps> {
  startTime: Date;
  endTime: Date;
  disabledIntervals: any;

  constructor(props:any){
    super(props)
      const getTodayAtSpecificHour = (time:any, hour:number=0, minute :number=0, second :number=0, milliseconds = 0) =>
      {
        return  set(time, { hours: hour, minutes: minute, seconds: second, milliseconds: 0 })
      }
      this.startTime =  getTodayAtSpecificHour(this.props.startTime,this.props.startTime.getHours(), this.props.startTime.getMinutes(), this.props.startTime.getSeconds())
      this.endTime =  getTodayAtSpecificHour(this.props.endTime, this.props.endTime.getHours(), this.props.endTime.getMinutes(), this.props.endTime.getSeconds())
  } 

  onUpdateCallbackFun = ((e:any)=>{
    this.props.searchCallBack(
      new Date(e.time[0].getTime() + this.startTime.getTime()), 
      new Date(e.time[1].getTime() + this.startTime.getTime()));
  })

  pad(num: number, n : string, pad: string) {

  }
  
  

  render()  {  
      return   (  
          <TimeRange 
          ticksNumber={(this.endTime.getMinutes() - this.startTime.getMinutes()) || 6}  
          selectedInterval={[
            new Date(this.props.currentstartTime.getTime() - this.startTime.getTime()),  
            new Date(this.props.currentendTime.getTime() - this.startTime.getTime()) ]} 
          timelineInterval={[
            new Date(0),
            new Date(this.endTime.getTime() - this.startTime.getTime())]}  
          onUpdateCallback={this.onUpdateCallbackFun}  
          formatTick={(t) => {
            return moment.utc(t).format('mm:ss');
          }}
          disabledIntervals={this.disabledIntervals}  
        />
      )  
  }  
}  

export default TimelineRangeSlider




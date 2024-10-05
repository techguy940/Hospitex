import './css/customcalendar.css';
import {useEffect, useState} from 'react';
import moment from "moment";
import { Tooltip } from 'react-tooltip'

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function isLeapYear(year){
    return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0)
}

const DAYS_TO_ADD = {
    January: 31,
    February: 28,
    LeapFebruary: 29,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31
}

function CustomCalendar(props){
    const calendarDate = new Date(moment(new Date(props.date.split("/").reverse().join("-")).toISOString().substring(0, 10)))
    const order = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const [calendarValues, setCalendarValues] = useState([])
    const [toolTips, setToolTips] = useState([])
    const [tipDisplay, setTipDisplay] = useState("none")
    const [tipLeft, setTipLeft] = useState("0")
    const [tipTop, setTipTop] = useState("0")
    const [tipText, setTipText] = useState("")
    
    useEffect(() => {
        const start = calendarDate
        const startMonth = start.toLocaleString("default", {month: "long"})
        var curDate = moment(start).format("DD/MM/YYYY")
        const days = isLeapYear(parseInt(start.getFullYear())) === true ? (startMonth === "February" ? DAYS_TO_ADD.LeapFebruary : DAYS_TO_ADD.February) : DAYS_TO_ADD[startMonth]
        const end = new Date(start.getTime() + days*86400000)
        const values = []
        const firstDay = start.toLocaleString("default", {weekday: "long"})
        const startOffset = order.indexOf(firstDay)
        const keys = Object.keys(props.data)
        const _toolTips = []
        for (var i=1; i<=startOffset; i++){
            values.push(<div className="day"></div>)
        }
        for (var i=1; i<=days; i++){
            const id = moment(curDate).valueOf().toString()
            values.push(<div className={keys.indexOf(curDate) !== -1 ? props.data[curDate]['status'] === "present" ? "day present" : "day absent": "day"} data-tooltip-id={keys.indexOf(curDate) !== -1 ? props.data[curDate]['status'] === "absent" ? id : "": ""}>{i}</div>)
            if (keys.indexOf(curDate) !== -1){
                if (props.data[curDate]['status'] === "absent"){
                    _toolTips.push(<Tooltip id={id} content={capitalize(props.data[curDate]['leave_type']) + " Leave"} style={{backgroundColor: "red", color: "white"}} place="right" />)
                }
            }
            curDate = moment(start).add(i, "day").format("DD/MM/YYYY")
        }
        const endOffset = order.length - order.indexOf(end.toLocaleString("default", {weekday: "long"}))
        for (var i=1;i<=endOffset;i++){
            values.push(<div className="day"></div>)
        }
        setCalendarValues(values)
        setToolTips(_toolTips)
    }, [])
    return (
        <div>
            <div className="calendar-parent">
                <p className="calendar-title">{calendarDate.toLocaleString("default", {month: "long", year: "numeric"})}</p>
                <div className="calendar-main">
                    <div className="day head">Sun</div>
                    <div className="day head">Mon</div>
                    <div className="day head">Tue</div>
                    <div className="day head">Wed</div>
                    <div className="day head">Thu</div>
                    <div className="day head">Fri</div>
                    <div className="day head">Sat</div>
                    {calendarValues}
                </div>
            </div>
            {/* <div id="tip" style={{backgroundColor: "red", padding: "1rem", position: "absolute", color: "white", display: tipDisplay, left: tipLeft, top: tipTop, zIndex: "999"}}>{tipText}</div> */}
            {toolTips}
        </div>
    )
}

export default CustomCalendar;
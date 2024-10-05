import './css/statistics.css';
import moment from "moment";
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Chart from './chart.js';

function Customer(props){
    return (
        <div className="customer">
            <section>
                <p className="customer-name">{props.name}</p>
                <p className="customer-time">{moment(props.time).calendar()}</p>
            </section>
            <section>
                <p className="customer-room-num">{props.roomNum}</p>
            </section>
        </div>
    )
}
function Statistics(){
    const [recentCustomers, setRecentCustomers] = useState([])
    const [salesText, setSalesText] = useState("Sales today")
    const [searchTerm, setSearchTerm] = useState("today")
    const [salesAmount, setSalesAmount] = useState(0)
    const [fromInp, setFromInp] = useState("")
    const [toInp, setToInp] = useState("")
    const [toDate, setToDate] = useState("")
    const [fromDate, setFromDate] = useState("")

    const [advanceText, setAdvanceText] = useState("Advance today")
    const [searchTerm2, setSearchTerm2] = useState("today")
    const [advanceAmount, setAdvanceAmount] = useState(0)
    const [fromInp2, setFromInp2] = useState("")
    const [toInp2, setToInp2] = useState("")
    const [toDate2, setToDate2] = useState("")
    const [fromDate2, setFromDate2] = useState("")
    
    const [salesChart, setSalesChart] = useState(<Chart data={[]} />)
    const [advanceChart, setAdvanceChart] = useState(<Chart data={[]} />)
    useEffect(() => {
        if (searchTerm === "today"){
            const _from = new Date(new Date().toISOString().substring(0, 10) + " 00:00:00")
            setFromInp(_from.getTime()/1000)
            const _to = new Date(new Date().toISOString().substring(0, 10) + " 23:59:59")
            setToInp(_to.getTime()/1000)

            setFromDate(_from.toISOString().substring(0, 10))
            setToDate(_to.toISOString().substring(0, 10))

            setSalesText("Sales today")
        } else if (searchTerm === "this-week"){
            const now = new Date()
            const weekStart = new Date(now.getTime() - ((now.getDay()-1) * 86400000))
            setToInp(now.getTime()/1000)
            setFromInp(weekStart.getTime()/1000)

            setFromDate(weekStart.toISOString().substring(0, 10))
            setToDate(now.toISOString().substring(0, 10))
            setSalesText("Sales this week")

        } else if (searchTerm === "this-month"){
            const now = new Date()
            const monthStart = new Date(now.toISOString().substring(0, 8) + "01")
            setToInp(now.getTime()/1000)
            setFromInp(monthStart.getTime()/1000)

            setFromDate(monthStart.toISOString().substring(0, 10))
            setToDate(now.toISOString().substring(0, 10))
            setSalesText("Sales this month")

        } else if (searchTerm === "six-months"){
            const now = new Date()
            const lastMonth = new Date(now.getTime() - (31*6 * 86400000))
            setFromInp(lastMonth.getTime()/1000)
            setToInp(now.getTime()/1000)

            setFromDate(lastMonth.toISOString().substring(0, 10))
            setToDate(now.toISOString().substring(0, 10))
            setSalesText("Sales in last 6 months")

        } else if (searchTerm === "this-year"){
            const now = new Date()
            const _thisYear = now.getFullYear()
            const thisYear = new Date(_thisYear.toString() + "-01-01")
            setToInp(now.getTime()/1000)
            setFromInp(thisYear.getTime()/1000)

            setFromDate(thisYear.toISOString().substring(0, 10))
            setToDate(now.toISOString().substring(0, 10))
            setSalesText("Sales this year")

        } else if (searchTerm === "lifetime"){
            setFromDate("")
            setToDate("")
            setToInp("")
            setFromInp("")
            setSalesText("Sales lifetime")
        }
    }, [searchTerm])

    useEffect(() => {
        if (searchTerm2 === "today"){
            const _from = new Date(new Date().toISOString().substring(0, 10) + " 00:00:00")
            setFromInp2(_from.getTime()/1000)
            const _to = new Date(new Date().toISOString().substring(0, 10) + " 23:59:59")
            setToInp2(_to.getTime()/1000)

            setFromDate2(_from.toISOString().substring(0, 10))
            setToDate2(_to.toISOString().substring(0, 10))

            setAdvanceText("Advance today")
        } else if (searchTerm2 === "this-week"){
            const now = new Date()
            const weekStart = new Date(now.getTime() - ((now.getDay()-1) * 86400000))
            setToInp2(now.getTime()/1000)
            setFromInp2(weekStart.getTime()/1000)

            setFromDate2(weekStart.toISOString().substring(0, 10))
            setToDate2(now.toISOString().substring(0, 10))
            setAdvanceText("Advance this week")

        } else if (searchTerm2 === "this-month"){
            const now = new Date()
            const monthStart = new Date(now.toISOString().substring(0, 8) + "01")
            setToInp2(now.getTime()/1000)
            setFromInp2(monthStart.getTime()/1000)

            setFromDate2(monthStart.toISOString().substring(0, 10))
            setToDate2(now.toISOString().substring(0, 10))
            setAdvanceText("Advance this month")

        } else if (searchTerm2 === "six-months"){
            const now = new Date()
            const lastMonth = new Date(now.getTime() - (31*6 * 86400000))
            setFromInp2(lastMonth.getTime()/1000)
            setToInp2(now.getTime()/1000)

            setFromDate2(lastMonth.toISOString().substring(0, 10))
            setToDate2(now.toISOString().substring(0, 10))
            setAdvanceText("Advance in last 6 months")

        } else if (searchTerm2 === "this-year"){
            const now = new Date()
            const _thisYear = now.getFullYear()
            const thisYear = new Date(_thisYear.toString() + "-01-01")
            setToInp2(now.getTime()/1000)
            setFromInp2(thisYear.getTime()/1000)

            setFromDate2(thisYear.toISOString().substring(0, 10))
            setToDate2(now.toISOString().substring(0, 10))
            setAdvanceText("Advance this year")

        } else if (searchTerm2 === "lifetime"){
            setFromDate2("")
            setToDate2("")
            setToInp2("")
            setFromInp2("")
            setAdvanceText("Advance lifetime")
        }
    }, [searchTerm2])
    useEffect(() => {
        fetch("http://127.0.0.1:8080/get_advance", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({search_term: searchTerm2, from: fromInp2, to: toInp2})})
        .then(res => res.json())
        .then(data => {
            if (data.status === false) return
            const advance = data.advance
            const _advanceOptions = []
            const keys = Object.keys(advance)
            var amount = 0
            keys.forEach(key => {
                amount = amount + advance[key]
                _advanceOptions.push({date: key, "Amount": advance[key]})
            })
            setAdvanceAmount(amount)
            if (_advanceOptions.length === 0){
                setAdvanceChart(<h1 className="no-advance">No Advance</h1>)
            } else {
                setAdvanceChart(<Chart data={_advanceOptions} />)
            }

        })
    }, [fromInp2, toInp2])
    useEffect(() => {
        fetch("http://127.0.0.1:8080/get_sales", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({search_term: searchTerm, from: fromInp, to: toInp})})
        .then(res => res.json())
        .then(data => {
            if (data.status === false) return
            const sales = data.sales
            const _salesOptions = []
            const keys = Object.keys(sales)
            var amount = 0
            keys.forEach(key => {
                amount = amount + sales[key]
                _salesOptions.push({date: key, "Amount": sales[key]})
            })
            setSalesAmount(amount)
            if (_salesOptions.length === 0){
                setSalesChart(<h1 className="no-sales">No Sales</h1>)
            } else {
                setSalesChart(<Chart data={_salesOptions} />)
            }
        })
    }, [fromInp, toInp])
    useEffect(() => {
        fetch("http://127.0.0.1:8080/recent_customers", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === false) return
            const customers = []
            data.data.forEach(customer => {
                customer.time = customer.time.substring(0, 4) + "-" + customer.time.substring(4, 6) + "-" + customer.time.substring(6, 8) + " " + customer.time.substring(8, 10) + ":" + customer.time.substring(10, 12) + ":" + customer.time.substring(12, 14)
                customers.push(customer)
            })
            setRecentCustomers(customers)
        })
    }, [])

    const navigate = useNavigate()
    useEffect(() => {
        const auth = window.sessionStorage.getItem("auth");
        if (auth === 'false' || auth == null) {
            navigate("/")
            return
        }
        fetch("http://127.0.0.1:8080/verify", {method: "POST", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === false){
                navigate("/")
                return
            }
        })

        fetch("http://127.0.0.1:8080/get_hotel_details", {credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.message === "Hotel details not found") {
                navigate("/set-hotel-details")
                return
            }
        })
    }, [])
    return (
        <div>
            <div className="statistic-main">
                <div className="statistics-title">
                    <h1>Statistics</h1>
                </div>
                <div className="content-main">
                    <div className="recent-customers">
                        <section className="recent-customers-title">
                            <i className="fi fi-rr-clock-three"></i>
                            <p>Recent Customers</p>
                        </section>
                        <section className="recent-customer-details">
                            {recentCustomers.map(customer => <Customer name={customer.name} roomNum={customer.room_num} time={customer.time} />)}
                        </section>
                    </div>
                    <div className="sales-data">
                        <div className="sales-text">
                            <section className="sales-title-section">
                                <i className="fi fi-rr-money-bills-simple"></i>
                                <p className="sales-title">{salesText}</p>
                            </section>
                            <p className="sales-amount orange">{"₹ " + salesAmount.toString()}</p>
                            <section className="date-btns">
                                <button className="date-btn" title="Today" onClick={() => setSearchTerm("today")}>1D</button>
                                <button className="date-btn" title="This Week" onClick={() => setSearchTerm("this-week")}>1W</button>
                                <button className="date-btn" title="This Month" onClick={() => setSearchTerm("this-month")}>1M</button>
                                <button className="date-btn" title="6 Months" onClick={() => setSearchTerm("six-months")}>6M</button>
                                <button className="date-btn" title="1 Year" onClick={() => setSearchTerm("this-year")}>1Y</button>
                                <button className="date-btn" title="Lifetime" onClick={() => setSearchTerm("lifetime")}>LF</button>
                            </section>
                            <section className="custom-date">
                                <section>
                                    <label>From</label>
                                    <input type="date" value={fromDate} onChange={(e) => {
                                        setFromInp(new Date(e.target.value).getTime() / 1000)
                                        setFromDate(e.target.value)
                                        setSalesText("Sales")

                                    }}/>
                                </section>
                                <section>
                                    <label>To</label>
                                    <input type="date" value={toDate} onChange={(e) => {
                                        setToInp(new Date(e.target.value).getTime() / 1000)
                                        setToDate(e.target.value)
                                        setSalesText("Sales")

                                    }}/>
                                </section>
                            </section>
                        </div>
                    </div>
                    <div className="advance-data">
                        <div className="advance-text">
                            <section className="advance-title-section">
                                <i className="fi fi-rr-money-bills-simple"></i>
                                <p className="advance-title">{advanceText}</p>
                            </section>
                            <p className="advance-amount orange">{"₹ " + advanceAmount.toString()}</p>
                            <section className="date-btns">
                                <button className="date-btn" title="Today" onClick={() => setSearchTerm2("today")}>1D</button>
                                <button className="date-btn" title="This Week" onClick={() => setSearchTerm2("this-week")}>1W</button>
                                <button className="date-btn" title="This Month" onClick={() => setSearchTerm2("this-month")}>1M</button>
                                <button className="date-btn" title="6 Months" onClick={() => setSearchTerm2("six-months")}>6M</button>
                                <button className="date-btn" title="1 Year" onClick={() => setSearchTerm2("this-year")}>1Y</button>
                                <button className="date-btn" title="Lifetime" onClick={() => setSearchTerm2("lifetime")}>LF</button>
                            </section>
                            <section className="custom-date">
                                <section>
                                    <label>From</label>
                                    <input type="date" value={fromDate2} onChange={(e) => {
                                        setFromInp2(new Date(e.target.value).getTime() / 1000)
                                        setFromDate2(e.target.value)
                                        setAdvanceText("Advance")
                                    }}/>
                                </section>
                                <section>
                                    <label>To</label>
                                    <input type="date" value={toDate2} onChange={(e) => {
                                        setToInp2(new Date(e.target.value).getTime() / 1000)
                                        setToDate2(e.target.value)
                                        setAdvanceText("Advance")
                                    }}/>
                                </section>
                            </section>
                        </div>
                    </div>
                </div>
                <div className="charts-main">
                    <section>
                        <h1>Sales Graph</h1>
                        {salesChart}
                    </section>
                    <section>
                        <h1>Advance Graph</h1>
                        {advanceChart}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Statistics;
import './css/customsearch.css';
import {useState, useEffect, useDebugValue} from 'react';

function CustomSearch(props){
    const [searchQuery, setSearchQuery] = useState("")
    const [salaryFrom, setSalaryFrom] = useState()
    const [salaryTo, setSalaryTo] = useState()
    const [designation, setDesignation] = useState("all")
    const [bloodGroup, setBloodGroup] = useState("all")
    const [doa, setDOA] = useState()
    const [dor, setDOR] = useState()
    const [dateFrom, setDateFrom] = useState()
    const [dateTo, setDateTo] = useState()
    const [designations, setDesignations] = useState([])
    const [expandClass, setExpandClass] = useState("expand-wrapper")
    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

    useEffect(() => {
        fetch("http://127.0.0.1:8080/staff_designations", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === true){
                setDesignations(data.designations)
            }
        })
    }, [])

    function handleSearch(){
        const _salaryFrom = (salaryFrom === undefined || salaryFrom === "") ? 0 : parseInt(salaryFrom)
        const _salaryTo = (salaryTo === undefined || salaryTo === "") ? Infinity : parseInt(salaryTo)
        const _doa = (doa === undefined || doa === "") ? "" : new Date(doa).getTime() / 1000
        const _dor = (dor === undefined || dor === "") ? "" : new Date(dor).getTime() / 1000
        const _dateFrom = (dateFrom === undefined || dateFrom === "")? 0 : new Date(dateFrom).getTime() / 1000
        const _dateTo = (dateTo === undefined || dateTo === "") ? Infinity : new Date(dateTo).getTime() / 1000
        props.onSearch(searchQuery, _salaryFrom, _salaryTo, designation, bloodGroup, _doa, _dor, _dateFrom, _dateTo)
        console.log("DONE")
        return
    }

    return (
        <div className="search-wrapper">
            <div className="search-main">
                <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} id="query-input" />
                <section>
                    <i className="fi fi-br-cross-small" onClick={() => {
                        setSearchQuery("")
                        setSalaryFrom("")
                        setSalaryTo("")
                        setDesignation("all")
                        setBloodGroup("all")
                        setDOA("")
                        setDOR("")
                        setDateFrom("")
                        setDateTo("")
                    }}></i>
                    <i className="fi fi-rr-settings-sliders" onClick={() => {
                        if (expandClass === "expand-wrapper"){
                            setExpandClass("expand-wrapper active")
                        } else {
                            setExpandClass("expand-wrapper")
                        }
                    }}></i>
                    <i className="fi fi-br-search" onClick={handleSearch}></i>
                </section>
            </div>
            <div className={expandClass}>
                <div className="search-filters-wrapper">
                    <div className="search-filters">
                        <div className="search-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Salary
                                </p>
                            </section>
                            <section className="filter-inner-wrap">
                                <section className="filter-inp-wrap">
                                    <span>₹ </span>
                                    <input type="number" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} min="0" id="salary-from-input" />
                                </section>
                                <section className="filter-inp-wrap">
                                    <span>to</span>
                                </section>
                                <section className="filter-inp-wrap">
                                <span>₹ </span>
                                    <input type="number" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} min="0" id="salary-to-input" />
                                </section>
                            </section>
                        </div>
                        <div className="search-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Designation
                                </p>
                            </section>
                            <section className="filter-inner-wrap">
                                <select onChange={(e) => setDesignation(e.target.value)} value={designation}>
                                    <option value="all">All</option>
                                    {designations.map(designation => <option value={designation}>{designation}</option>)}
                                </select>
                            </section>
                        </div>
                        <div className="search-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Blood Group
                                </p>
                            </section>
                            <section className="filter-inner-wrap">
                                <select onChange={(e) => setBloodGroup(e.target.value)} value={bloodGroup}>
                                    <option value="all">All</option>
                                    {bloodGroups.map(bloodGroups => <option value={bloodGroups}>{bloodGroups}</option>)}
                                </select>
                            </section>
                        </div>
                    </div>
                    <div className="search-filters">
                        <div className="search-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Date of Appointment
                                </p>
                            </section>
                            <section className="filter-inner-wrap">
                                <input type="date" value={doa} onChange={(e) => setDOA(e.target.value)} id="doa-input" />
                            </section>
                        </div>
                        <div className="search-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Date of Resignation
                                </p>
                            </section>
                            <section className="filter-inner-wrap">
                                <input type="date" value={dor} onChange={(e) => setDOR(e.target.value)} id="dor-input" />
                            </section>
                        </div>
                        <div className="search-filter custom-date-filter">
                            <section className="filter-inner-wrap">
                                <p className="filter-title orange">
                                    Custom Date Range
                                </p>
                            </section>
                            <section className="filter-inner-wrap custom-date">
                                <section className="filter-inp-wrap custom-date-wrap">
                                    <span>From : </span>
                                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} id="date-from-input" />
                                </section>
                                <section className="filter-inp-wrap custom-date-wrap">
                                    <span>To : </span>
                                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} id="date-to-input" />
                                </section>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomSearch;
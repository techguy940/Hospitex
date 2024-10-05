import './css/pastrecords.css';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './sidebar.js';

function urltoFile(url, filename, mimeType){
    if (url.startsWith('data:')) {
        var arr = url.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[arr.length - 1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], filename, {type: mime || mimeType});
        return file;
    }
}

function Record(props){
    const [icon, setIcon] = useState("fi fi-rr-angle-down")
    const [active, setActive] = useState("record-details")
    const [briefClass, setBriefClass] = useState("brief active")
    const [expandActive, setExpandActive] = useState("expand-wrapper")
    const [btnText, setBtnText] = useState("Download Invoice")
    const [docsText, setDocsText] = useState("Documents")
    const [editRecordClass, setEditRecordClass] = useState("fi fi-rr-pen-circle")
    const [contentEditable, setContentEditable] = useState(false)
    const [name, setName] = useState(props.record.name)
    const [roomNum, setRoomNum] = useState(props.record.room_num)
    const [from, setFrom] = useState(props.record.from)
    const [to, setTo] = useState(props.record.to)
    const [phoneNum, setPhoneNum] = useState(props.record.phone_num)
    const [members, setMembers] = useState(props.record.members)
    const [identity, setIdentity] = useState(props.record.identity)
    const [gstn, setGSTN] = useState(props.record.gstn)
    const [food, setFood] = useState(props.record.food)
    const [ppn, setPpn] = useState(props.record.ppn)
    const [advance, setAdvance] = useState(props.record.advance)
    const [documents, setDocuments] = useState([])
    const [test, setTest] = useState(false)
    const [final, setFinal] = useState(false)
    const [docsData, setDocsData] = useState(props.record.documents)

    useEffect(() => {
        const keys = Object.keys(docsData)
        const _docs = []
        keys.forEach(key => {
            _docs.push(urltoFile(docsData[key], key, "application/pdf"))
        })
        setDocuments(_docs)
    }, [])

    function CustomFile(props){
        const [fileBase64, setFileBase64] = useState("")
        const [status, setStatus] = useState(false)
        useEffect(() => {
            const reader = new FileReader()
            reader.addEventListener("load", (e) => {
                setFileBase64(reader.result)
                setStatus(true)
            })
            reader.readAsDataURL(props.file)
        }, [])
        return (
            <div className="file-text">
                <label className="file-name" onClick={() => {
                    const a = document.createElement("a")
                    a.href = fileBase64;
                    a.download = props.file.name
                    a.click();
                    a.remove()
                }}>{props.file.name}</label>
                <label className="file-status" id={props.file.name.toLowerCase().replace(" ", "--")}>{props.contentEditable === true ? status === false ? "Uploading" : <i className="fi fi-rs-trash" onClick={() => {
                    const _docs = documents
                    _docs.forEach(file => {
                        if (file.name === props.file.name){
                            _docs.splice(_docs.indexOf(file), 1)
                        }
                    })
                    setDocuments(_docs)
                    setTest(!test)
                }}></i> : ""}</label>
            </div>
        )
    }

    function downloadInvoice(txnId){
        setBtnText("Generating Invoice...")
        fetch("http://127.0.0.1:8080/generate_invoice", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({txn_id: txnId})})
        .then(res => res.json())
        .then(data => {
            const a = document.createElement("a")
            a.href = data.file;
            a.download = txnId + ".pdf";
            a.click();
            a.remove()
            setBtnText("Download Invoice")
        })
    }
    // {
    //     "food": "BD",
    //     "food_items": [
    //         [
    //             "Tea",
    //             996332,
    //             20,
    //             10,
    //             200
    //         ]
    //     ],
    //     "from": "08/07/2023",
    //     "identity": "DZMPK8220P",
    //     "members": 4,
    //     "name": "Nirmit Justin",
    //     "phone_num": "+919888056477",
    //     "ppn": 3400,
    //     "room_num": "101",
    //     "to": "12/07/2023",
    //     "total_invoice_value": 16284,
    //     "txn_id": "TXN20230703112253"
    // }
    function openDetails(e){
        if (e.target.className === "fi fi-rr-pen-circle" ||  e.target.className === "fi fi-rs-check-circle"){
            return
        }
        if (icon === "fi fi-rr-angle-down"){
            setIcon("fi fi-rr-angle-up")
            setActive("record-details active")
            setExpandActive("expand-wrapper active")
            setBriefClass("brief")
        } else {
            setIcon("fi fi-rr-angle-down")
            setActive("record-details")
            setBriefClass("brief active")
            setExpandActive("expand-wrapper")


        }
    }

    function updateRecord(){
        if ((roomNum === "" || ppn === "" || parseInt(ppn) === 0 || phoneNum === "" || parseInt(members) === 0 || members === "" || phoneNum.length !== 13 || identity === "" || from === "" || to === "") || (gstn !== "-" && gstn.length !== 15)){
            toast.error("Invalid Input Given", {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            return
        }

        const _docsData = {}
        var count = documents.length
        if (count === 0){
            setDocsData(_docsData)
            setFinal(true)
        }
        documents.forEach(doc => {
            const reader = new FileReader()
            reader.addEventListener("load", (e) => {
                _docsData[doc.name] = e.target.result
                count = count - 1
                if (count === 0){
                    setDocsData(_docsData)
                    setFinal(true)
                }
            })
            reader.readAsDataURL(doc)
        })
    }

    useEffect(() => {
        if (final === false){
            return
        }
        const _from = from.split("/")
        const _fromDate = _from.reverse()
        const fromDate = _fromDate.join("-")
        const _to = to.split("/")
        const _toDate = _to.reverse()
        const toDate = _toDate.join("-")
        const payload = {
            room_num: roomNum,
            from: new Date(fromDate).getTime()/1000,
            to: new Date(toDate).getTime()/1000,
            txn_id: props.record.txn_id,
            customer_data: {
                name: name,
                members: members,
                phone_num: phoneNum,
                identity: identity,
                ppn: parseInt(ppn),
                food: food,
                gstn: gstn,
                advance: parseInt(advance),
                files: docsData
            }
        }
        fetch("http://127.0.0.1:8080/details", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
            .then(res => res.json())
            .then(data => {
                if (data.status === false){
                    toast.error(data.message, {
                        position: "top-right",
                        autoClose: 1500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                    return
                }
                toast.success(data.message, {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            })

        setFinal(false)
    }, [final])
    

    function editRecord(){
        if (editRecordClass === "fi fi-rr-pen-circle"){
            setEditRecordClass("fi fi-rs-check-circle")
            setContentEditable(true)
            const elements = document.getElementsByClassName("rec-inp")
            Array.from(elements).forEach(elem => elem.disabled = false)
            setDocsText("Add Documents")
        } else if (editRecordClass === "fi fi-rs-check-circle"){
            const elements = document.getElementsByClassName("rec-inp")
            Array.from(elements).forEach(elem => elem.disabled = true)
            updateRecord()
            setEditRecordClass("fi fi-rr-pen-circle")
            setContentEditable(false)
            setDocsText("Documents")

        }
    }

    function handleFiles(e){
        const _docs = documents
        var count = Array.from(e.target.files).length
        Array.from(e.target.files).forEach(file => {
            _docs.push(file)
            count = count - 1
            if (count === 0){
                setDocuments(_docs)
                setTest(!test)
            }
        })
    }
    return (
        <div className="record-main">
            <div className="record-title" onClick={(e) => openDetails(e)} contentEditable={contentEditable}>
                <div className="record-brief">
                    <section className="record-name">
                        <h1 id="record-name" onInput={(e) => setName(e.currentTarget.innerText)}>{props.record.name}</h1>
                        {(new Date().getTime()/1000) < parseInt(props.record.to) ? <i className="fi fi-rr-pen-circle" style={{color: "#b8b8b8"}}></i> : <i className={editRecordClass} onClick={editRecord}></i>}
                    </section>
                    <section className={briefClass}>
                        <p>Transaction ID: <span className="orange">{props.record.txn_id}</span></p>
                        <p>Room Number: <span className="orange">{props.record.room_num}</span></p>
                    </section>
                </div>
                <i className={icon}></i>
            </div>
            <div className={expandActive}>
                <div className={active}>
                    <section className="brief">
                        <p>Transaction ID: <span className="orange">{props.record.txn_id}</span></p>
                        <p>Room Number: <input className="orange rec-inp" onChange={(e) => setRoomNum(e.target.value)} value={roomNum} disabled/></p>
                        <p>From: <input className="orange rec-inp" onChange={(e) => setFrom(e.target.value)} value={from} disabled/></p>
                        <p>To: <input className="orange rec-inp" onChange={(e) => setTo(e.target.value)} value={to} disabled/></p>
                        <p>Phone Number: <input className="orange rec-inp" onChange={(e) => setPhoneNum(e.target.value)} value={phoneNum} disabled/></p>
                        <p>Members: <input className="orange rec-inp" onChange={(e) => setMembers(e.target.value)} value={members} disabled/></p>
                        <p>Identity: <input className="orange rec-inp" onChange={(e) => setIdentity(e.target.value)} value={identity} disabled/></p>
                        <p>GSTN: <input className="orange rec-inp" onChange={(e) => setGSTN(e.target.value)} value={gstn} disabled/></p>
                        <p>Food: <input className="orange rec-inp" onChange={(e) => setFood(e.target.value)} value={food} disabled/></p>
                        <p>PPN (Including Food): <span className="orange">₹ </span><input className="orange rec-inp" onChange={(e) => setPpn(e.target.value)} value={ppn} disabled/></p>
                        <p>Advance: <span className="orange">₹ </span><input className="orange rec-inp" onChange={(e) => setAdvance(e.target.value)} value={advance} disabled/></p>
                        <p>Total Invoice Value: <span className="orange">₹ </span><input className="orange" disabled value={props.record.total_invoice_value}/></p>
                        <section className="record-documents">
                            <span className="orange docs-title" onClick={() => {
                                if (docsText === "Add Documents"){
                                    document.getElementById("file-input").click()
                                }
                            }}>{docsText}</span>
                            <input type="file" multiple accept="application/pdf" onChange={(e) => handleFiles(e)} id="file-input" style={{display: "none"}} />
                            {documents.map(file => <CustomFile file={file} contentEditable={contentEditable} />)}
                        </section>
                        {/* <p>From: <input className="orange" contentEditable={contentEditable} onInput={(e) => setFrom(e.currentTarget.innerText)}>{from}</input></p>
                        <p>To: <input className="orange" contentEditable={contentEditable} onInput={(e) => setTo(e.currentTarget.innerText)}>{to}</input></p>
                        <p>Phone Number: <input className="orange" contentEditable={contentEditable} onInput={(e) => setPhoneNum(e.currentTarget.innerText)}>{phoneNum}</input></p>
                        <p>Members: <input className="orange" contentEditable={contentEditable} onInput={(e) => setMembers(e.currentTarget.innerText)}>{members}</input></p>
                        <p>Identity: <input className="orange" contentEditable={contentEditable} onInput={(e) => setIdentity(e.currentTarget.innerText)}>{identity}</input></p>
                        <p>GSTN: <input className="orange" contentEditable={contentEditable} onInput={(e) => setGSTN(e.currentTarget.innerText)}>{gstn}</input></p>
                        <p>Food: <input className="orange" contentEditable={contentEditable} onInput={(e) => setFood(e.currentTarget.innerText)}>{food}</input></p>
                        <p>PPN (Including Food): <input className="orange" contentEditable={contentEditable} onInput={(e) => setPpn(e.currentTarget.innerText)}>₹ {ppn}</input></p>
                        <p>Advance: <input className="orange" contentEditable={contentEditable} onInput={(e) => setAdvance(e.currentTarget.innerText)}>{"₹ " + advance}</input></p>
                        <p>Total Invoice Value: <span className="orange">{"₹ " + props.record.total_invoice_value}</span></p>
                        <section className="record-documents">
                            <span className="orange docs-title" onClick={() => {
                                if (docsText === "Add Documents"){
                                    document.getElementById("file-input").click()
                                }
                            }}>{docsText}</span>
                            <input type="file" multiple accept="application/pdf" onChange={(e) => handleFiles(e)} id="file-input" style={{display: "none"}} />
                            {documents.map(file => <CustomFile file={file} />)}
                        </section> */}
                        <p><button href="#" className="orange" id="download-invoice-btn" onClick={() => downloadInvoice(props.record.txn_id)}>{btnText}</button></p>
                    </section>
                </div>
            </div>
        </div>
    )
}


function CustomerRecords(){
    const [query, setQuery] = useState("")
    const [searchby, setSearchBy] = useState("room_num")
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [recordsActive, setRecordsActive] = useState("records")
    const [records, setRecords] = useState([])
    const [maxDate, setMaxDate] = useState("")
    const [toMinDate, setToMinDate] = useState("")
    const [extra, setExtra] = useState(0)

    useEffect(() => {
        const now = new Date()
        setMaxDate(now.toISOString().substring(0,10))
    }, [])

    useEffect(() => {
        if (extra === 0){
            return
        }
        searchRecords()
    }, [extra])
    


    function searchRecords(){
        if ((query === "") && (searchby !== "date") && (from === "" && to === "")){
            toast.error("Query can not be empty", {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            return
        }
        if ((searchby === "date") && (from === "" && to === "")){
            toast.error("From-To range is required", {
                position: "top-right",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            return
        }

        setRecordsActive("records active")
        const _from = new Date(from)
        const _fromTime = (_from.getTime())/1000

        const _to = new Date(to)
        const _toTime = (_to.getTime())/1000

        fetch("http://127.0.0.1:8080/records", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({searchby: searchby, query: query, from: _fromTime, to: _toTime})})
        .then(res => res.json())
        .then(data => {
            if (data.status === false){
                toast.error(data.message, {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return
            }
            setRecords(data.records)
        })
    }

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
            <Sidebar active="customer-records" />
            <div className="past-records-parent">
                <div className="past-records-title">
                    <h1>Customer <span className="orange">Records</span></h1>
                </div>
                <div className="past-records-input">
                    <section>
                        <label>Search Query</label>
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name/ Room Number/ Identity/ Transaction ID" onKeyDown={(e) => {
                            if (e.code === "Enter"){
                                searchRecords()
                            }
                        }}/>
                    </section>
                    <section>
                        <label>Search by</label>
                        <select value={searchby} onChange={(e) => setSearchBy(e.target.value)} id="searchby-select">
                            <option defaultValue value="room_num">Room Number</option>
                            <option value="name">Name</option>
                            <option value="identity">Identity</option>
                            <option value="txn_id">Transaction ID</option>
                            <option value="phone_num">Phone Number</option>
                            <option value="date">Date</option>
                        </select>
                    </section>
                    <section>
                        <label>From</label>
                        <input type="date" value={from} onChange={(e) => {
                            setFrom(e.target.value)
                            setToMinDate(e.target.value)
                        }} className="date-input" max={maxDate} />
                    </section>
                    <section>
                        <label>To</label>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="date-input" max={maxDate} min={toMinDate} />
                    </section>
                    <section className="search-section" onClick={searchRecords} id="search-btn-div">
                        <i className="fi fi-br-search" id="search-btn"></i>
                    </section>
                </div>
                <div className="past-records-btns">
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const weekStart = new Date(now.getTime() - ((now.getDay()-1) * 86400000))
                        setTo(now.toISOString().substring(0, 10))
                        setFrom(weekStart.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>This Week</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const monthStart = new Date(now.toISOString().substring(0, 8) + "01")
                        setTo(now.toISOString().substring(0, 10))
                        setFrom(monthStart.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>This Month</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const weekEnd = new Date(now.getTime() - ((now.getDay()) * 86400000))
                        const weekStart = new Date(now.getTime() - ((now.getDay()-1+7) * 86400000))
                        setTo(weekEnd.toISOString().substring(0, 10))
                        setFrom(weekStart.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>Last Week</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const lastMonth = now.getTime() - (now.getDate() * 86400000)
                        const monthEnd = new Date(lastMonth)
                        const monthStart = new Date(monthEnd.toISOString().substring(0, 8) + "01")
                        setTo(monthEnd.toISOString().substring(0, 10))
                        setFrom(monthStart.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>Last Month</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const lastMonth = new Date(now.getTime() - (now.getDate() * 86400000))
                        const lastMonth2 = new Date(lastMonth.getTime() - (lastMonth.getDate() * 86400000))
                        const lastMonth3 = new Date(lastMonth2.getTime() - (lastMonth2.getDate() * 86400000))
                        setFrom(lastMonth3.toISOString().substring(0, 8) + "01")
                        setTo(lastMonth.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>Last 3 Months</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const lastMonth = new Date(now.getTime() - (now.getDate() * 86400000))
                        const lastMonth2 = new Date(lastMonth.getTime() - (lastMonth.getDate() * 86400000))
                        const lastMonth3 = new Date(lastMonth2.getTime() - (lastMonth2.getDate() * 86400000))
                        const lastMonth4 = new Date(lastMonth3.getTime() - (lastMonth3.getDate() * 86400000))
                        const lastMonth5 = new Date(lastMonth4.getTime() - (lastMonth4.getDate() * 86400000))
                        const lastMonth6 = new Date(lastMonth5.getTime() - (lastMonth5.getDate() * 86400000))
                        setFrom(lastMonth6.toISOString().substring(0, 8) + "01")
                        setTo(lastMonth.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>Last 6 Months</button>
                    <button className="past-records-btn" onClick={() => {
                        const now = new Date()
                        const _thisYear = now.getFullYear()
                        const thisYear = new Date(_thisYear.toString() + "-01-01")
                        setTo(now.toISOString().substring(0, 10))
                        setFrom(thisYear.toISOString().substring(0, 10))
                        if (query === "" && searchby !== "date"){
                            setSearchBy("date")
                        }
                        setExtra(extra + 1)
                    }}>This Year</button>
                </div>
                <div className={recordsActive}>
                    <p id="total-records">Records: <span className="orange">{records.length.toString()}</span></p>
                    {records.length > 0 ? records.map(record => <Record record={record} />) : <p>No Records Found</p>}
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}

export default CustomerRecords
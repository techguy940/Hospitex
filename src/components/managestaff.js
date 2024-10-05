import './css/managestaff.css';
import CustomSearch from './customsearch.js';
import {useState, useRef, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Modal from 'react-modal';
import CustomCalendar from './customcalendar.js';
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

function HistoryModalPopup(props){
    const [timePeriod, setTimePeriod] = useState("1m")
    const [from, setFrom] = useState(new Date(new Date().getTime() - (new Date().getDate()*86400000) + 86400000))
    const [to, setTo] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState({})
    const [calendars, setCalendars] = useState([])
    const [test, setTest] = useState(false)

    useEffect(() => {
        const now = new Date()
        if (timePeriod === "1m"){
            const _toDate = now
            const _from = new Date(_toDate.getTime() - (_toDate.getDate()*86400000) + 86400000)
            setTo(_toDate.toISOString().substring(0, 10))
            setFrom(_from.toISOString().substring(0, 10))
        } else if (timePeriod === "1ml"){
            const _toDate = new Date(now.getTime() - (now.getDate()*86400000))
            const _from = new Date(_toDate.getTime() - (_toDate.getDate()*86400000) + 86400000)
            setTo(_toDate.toISOString().substring(0, 10))
            setFrom(_from.toISOString().substring(0, 10))
        } else if (timePeriod === "3m"){
            const _toDate = new Date(now.getTime() - (now.getDate()*86400000))
            const lastMonth = new Date(_toDate.getTime() - (_toDate.getDate()*86400000))
            const lastMonth2 = new Date(lastMonth.getTime() - (lastMonth.getDate()*86400000))
            // const lastMonth3 = new Date(lastMonth2.getTime() - (lastMonth2.getDate()*86400000))
            const _from = new Date(lastMonth2.getTime() - (lastMonth2.getDate()*86400000) + 86400000)
            setTo(_toDate.toISOString().substring(0, 10))
            setFrom(_from.toISOString().substring(0, 10))
        } else if (timePeriod === "6m"){
            const _toDate = new Date(now.getTime() - (now.getDate()*86400000))
            const lastMonth = new Date(_toDate.getTime() - (_toDate.getDate()*86400000))
            const lastMonth2 = new Date(lastMonth.getTime() - (lastMonth.getDate()*86400000))
            const lastMonth3 = new Date(lastMonth2.getTime() - (lastMonth2.getDate()*86400000))
            const lastMonth4 = new Date(lastMonth3.getTime() - (lastMonth3.getDate()*86400000))
            const lastMonth5 = new Date(lastMonth4.getTime() - (lastMonth4.getDate()*86400000))
            const _from = new Date(lastMonth5.getTime() - (lastMonth5.getDate()*86400000) + 86400000)
            setTo(_toDate.toISOString().substring(0, 10))
            setFrom(_from.toISOString().substring(0, 10))
        } else if (timePeriod === "1y"){
            const _toDate = now
            const _from = new Date(_toDate.getFullYear()+"-01-01")
            setTo(_toDate.toISOString().substring(0, 10))
            setFrom(_from.toISOString().substring(0, 10))
        }
    }, [timePeriod])

    useEffect(() => {
        const fromSecs = new Date(from).getTime() / 1000
        const toSecs = new Date(to).getTime() / 1000
        if (props.id === "") return

        fetch("http://127.0.0.1:8080/staff_attendance_data", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: "custom", from: fromSecs, to: toSecs, id: props.id})})
        .then(res => res.json())
        .then(data => {
            setAttendanceData(data.attendance_data)
            setCalendars([])
        })
    }, [to, from, props.isOpen])

    useEffect(() => {
        const fromSecs = new Date(from).getTime() / 1000
        const toSecs = new Date(to).getTime() / 1000
        if (props.id === "") return

        fetch("http://127.0.0.1:8080/staff_attendance_data", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: "custom", from: fromSecs, to: toSecs, id: props.id})})
        .then(res => res.json())
        .then(data => {
            setAttendanceData(data.attendance_data)
            setCalendars([])
        })
    }, [])

    useEffect(() => {
        setCalendars(Object.keys(attendanceData).sort(function(a, b) {
            return (new Date(a.split("/").reverse().join("-"))) - (new Date(b.split("/").reverse().join("-")))
        }).map(key => <CustomCalendar date={key} data={attendanceData[key]} />))
    }, [attendanceData])

    useEffect(() => setTest(!test), [calendars])

    return (
        <Modal isOpen={props.isOpen} onRequestClose={props.close} contentLabel="View History Modal" style={{
            overlay: {
                position: "fixed",
                width: "100%",
                height: "100vh",
                color: 'rgba(255, 255, 255, 0.75)',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                padding: "0",
                margin: "0"
                
            },
            content: {
                display: "flex",
                backgroundColor: "white",
                height: "90vh",
                width: "90%",
                position: "fixed",
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                padding: "0"
            }
        }}>
            <div className="history-main">
                <div className="history-title">
                    <h1>Attendance History</h1>
                    <i className="fi fi-rr-cross-circle" onClick={props.close}></i>
                </div>
                <div className="history-text">
                    <p>Staff ID: <span className="orange">{props.id}</span></p>
                    <p>Staff Name: <span className="orange">{props.name}</span></p>
                </div>
                <div className="history-date-inputs">
                    <section>
                        <label>From</label>
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </section>
                    <section>
                        <label>To</label>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </section>
                </div>
                <div className="history-action-btns">
                    <button className="history-action-btn" onClick={() => setTimePeriod("1m")}>This Month</button>
                    <button className="history-action-btn" onClick={() => setTimePeriod("1ml")}>Last Month</button>
                    <button className="history-action-btn" onClick={() => setTimePeriod("3m")}>Last 3 Months</button>
                    <button className="history-action-btn" onClick={() => setTimePeriod("6m")}>Last 6 Months</button>
                    <button className="history-action-btn" onClick={() => setTimePeriod("1y")}>This Year</button>
                </div>
                <div className="history-calendars">
                    {/* {Object.keys(attendanceData).map(key => <CustomCalendar date={key} data={attendanceData[key]} />)} */}
                    {calendars}
                </div>
            </div>
        </Modal>
    )
}


function Staff(props){
    const [detailsOpen, setDetailsOpen] = useState(false)

    function detailsModalOpen(){
        setDetailsOpen(true)
    }

    function detailsModalClose(){
        setDetailsOpen(false)
    }

    function StaffDetailsModalPopup(){
        const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        const [name, setName] = useState(props.name)
        const [id, setId] = useState(props.id)
        const [spm, setSpm] = useState(props.spm)
        const [designation, setDesignation] = useState(props.designation)
        const [dob, setDOB] = useState(props.dob.toISOString().substring(0, 10))
        const [bloodGroup, setBloodGroup] = useState(props.blood_group)
        const [doa, setDOA] = useState(props.doa.toISOString().substring(0, 10))
        const [dor, setDOR] = useState(props.dor.toString() === "Invalid Date" ? "" : props.dor.toISOString().substring(0, 10))
        const [edu, setEdu] = useState(props.educational_qualifications)
        const [phoneNum, setPhoneNum] = useState(props.phone_num.replace("+91", ""))
        const [pan, setPan] = useState(props.pan)
        const [aadhar, setAadhar] = useState(props.aadhar)
        const [address, setAddress] = useState(props.address)
        const [image, setImage] = useState(props.imageSrc)
        const [documents, setDocuments] = useState([])
        const [docsData, setDocsData] = useState({})
        const [test, setTest] = useState(false)
        const [once, setOnce] = useState(false)
        const [btnText, setBtnText] = useState("Edit Details")
        const [payload, setPayload] = useState({})
        const [final, setFinal] = useState(false)


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
                        console.log(props.file)
                        a.click();
                        a.remove()
                    }}>{props.file.name}</label>
                    <label className="file-status" id={props.file.name.toLowerCase().replace(" ", "--")}>{btnText === "Edit Details" ? "" : status === false ? "Uploading" : <i className="fi fi-rs-trash" onClick={() => {
                        const _docs = documents
                        _docs.forEach(file => {
                            if (file.name === props.file.name){
                                _docs.splice(_docs.indexOf(file), 1)
                            }
                        })
                        setDocuments(_docs)
                        setTest(!test)
                    }}></i>}</label>
                </div>
            )
        }

        function initiateSubmit(){

            if (name === undefined || name === "" || id === undefined || id === "" || spm === undefined || spm === "" || doa === undefined || doa === "" || designation === undefined || designation === "" || dob === undefined || dob === "" || bloodGroup === undefined || bloodGroup === "" || edu === undefined || edu === "" || phoneNum === undefined || phoneNum === "" || phoneNum.length !== 10 || address === undefined || address === "" || image === undefined || image === "" || pan === "" || pan.length !== 10 || aadhar === "" || aadhar.length !== 12){
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
                const _payload = {
                    name: name,
                    id: id,
                    spm: spm,
                    designation: designation,
                    dob: new Date(dob).getTime() / 1000,
                    blood_group: bloodGroup,
                    doa: new Date(doa).getTime() / 1000,
                    address: address,
                    educational_qualifications: edu,
                    phone_num: "+91" + phoneNum,
                    image: image,
                    files: docsData,
                    pan: pan,
                    aadhar: aadhar
                }
                setPayload(_payload)
                setDocsData(_docsData)
                setFinal(true)
                return
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
            const _payload = {
                name: name,
                id: id,
                spm: spm,
                designation: designation,
                dob: new Date(dob).getTime() / 1000,
                blood_group: bloodGroup,
                doa: new Date(doa).getTime() / 1000,
                address: address,
                educational_qualifications: edu,
                phone_num: "+91" + phoneNum,
                image: image,
                files: docsData
            }
            setPayload(_payload)
            setFinal(false)
        }, [final])

        useEffect(() => {
            if (Object.keys(payload).length === 0){
                return
            }
            // if (final === false){
            //     return
            // }

            // const payload = {
            //     name: name,
            //     id: id,
            //     spm: spm,
            //     designation: designation,
            //     dob: new Date(dob).getTime() / 1000,
            //     blood_group: bloodGroup,
            //     doa: new Date(doa).getTime() / 1000,
            //     address: address,
            //     educational_qualifications: edu,
            //     phone_num: "+91" + phoneNum,
            //     image: image,
            //     files: docsData
            // }
            // console.log(payload)
            // return
            fetch("http://127.0.0.1:8080/staff_details", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
            .then(res => res.json())
            .then(data => {
                setBtnText(btnText === "Update Details" ? "Edit Details" : "Update Details")
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
                setTimeout(() => detailsModalClose(), 2500)
                // setTimeout(() => window.location.reload(), 3000)

            })

            setPayload({})
        }, [payload])

        useEffect(() => {
            fetch("http://127.0.0.1:8080/staff_documents", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: props.id})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
                    const keys = Object.keys(data.documents)
                    const _docs = []
                    var count = keys.length
                    keys.forEach(key => {
                        _docs.push(urltoFile(data.documents[key], key, "application/pdf"))
                        count = count - 1
                        if (count === 0){
                            setDocuments(_docs)
                            setDocsData(data.documents)
                            setTest(!test)
                        }
                    })
                    // setDocuments(_docs)
                    // setDocsData(data.documents)
                    // setTest(!test)
                }
            })
        }, [once])

        return (
            <Modal isOpen={detailsOpen} onRequestClose={detailsModalOpen} contentLabel="Staff Details Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    padding: "0",
                    margin: "0"
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "90vh",
                    width: "auto",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    padding: "0"
                }
            }}>
                <div className="add-staff-main">
                    <div className="add-staff-title view-details">
                        <h1>View Staff Details</h1>
                        <i className="fi fi-rr-cross-circle" onClick={detailsModalClose}></i>
                    </div>
                    <div className="add-staff-inputs" id="view-inputs">
                        <section className="add-staff-input-wrapper-row">
                            <section className="add-staff-input-sec1">
                                <section>
                                    <label>Name <span className="compulsory">*</span></label>
                                    <input type="text" id="staff-name-input" value={name} onChange={(e) => setName(e.target.value)} disabled className="details-input"/>
                                </section>
                                <section>
                                    <label>ID <span className="compulsory">*</span></label>
                                    <input type="text" id="staff-id-input" value={id} disabled />
                                </section>
                                <section>
                                    <label>SPM <span className="compulsory">*</span></label>
                                    <section>
                                        <span>₹ </span>
                                        <input type="number" id="staff-spm-input" value={spm} onChange={(e) => setSpm(e.target.value)} disabled className="details-input"/>
                                    </section>
                                </section>
                            </section>
                            <section className="add-staff-input-sec2">
                                <section>
                                    <label>Staff Image <span className="compulsory">*</span></label>
                                    <input type="file" disabled id="staff-image-input" className="details-input" onChange={(e) => {
                                        const reader = new FileReader()
                                        reader.addEventListener("load", (e) => setImage(e.target.result))
                                        reader.readAsDataURL(e.target.files[0])
                                    }} />
                                    <img id="staff-image" src={image} alt="" />
                                </section>
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Date of Appointment <span className="compulsory">*</span></label>
                                <input type="date" id="staff-doa-input" value={doa} disabled className="date-view" />
                            </section>
                            <section>
                                <label>Date of Resignation <span className="compulsory">*</span></label>
                                <input type="date" id="staff-dor-input" value={dor} disabled className="date-view"/>
                            </section>
                            <section>
                                <label>Date of Birth <span className="compulsory">*</span></label>
                                <input type="date" id="staff-dob-input" value={dob} onChange={(e) => setDOB(e.target.value)} className="date-view details-input" disabled/>
                            </section>
                            <section>
                                <label>Blood Group <span className="compulsory">*</span></label>
                                <select id="staff-blood-group-input" disabled onChange={(e) => setBloodGroup(e.target.value)} defaultValue={bloodGroup} className="date-view details-input">
                                    {bloodGroups.map(bg => <option value={bg}>{bg}</option>)}
                                </select>
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Educational Qualifications <span className="compulsory">*</span></label>
                                <input type="text" id="staff-edu-input-view" disabled className="details-input" value={edu} onChange={(e) => setEdu(e.target.value)} />
                            </section>
                            <section id="staff-phone-num-input-sec-view">
                                <label>Phone Number <span className="compulsory">*</span></label>
                                <section>
                                    <span>+91 </span>
                                    <input type="number" id="staff-phone-num-input-view" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} disabled className="details-input" />
                                </section>
                            </section>
                            <section>
                                <label>Designation <span className="compulsory">*</span></label>
                                <input type="text" id="staff-designation-input-view" value={designation} onChange={(e) => setDesignation(e.target.value)} disabled className="details-input" />
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>PAN Number <span className="compulsory">*</span></label>
                                <input type="text" id="staff-pan-input-view" disabled className="details-input" value={pan} onChange={(e) => setPan(e.target.value)} />
                            </section>
                            <section>
                                <label>Aadhar Number <span className="compulsory">*</span></label>
                                <input type="text" id="staff-aadhar-input-view" value={aadhar} onChange={(e) => setAadhar(e.target.value)} disabled className="details-input" />
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Address <span className="compulsory">*</span></label>
                                <textarea id="staff-address-input" value={address} onChange={(e) => setAddress(e.target.value)} rows="3" disabled className="details-input"/>
                            </section>
                        </section>
                        <section className="add-staff-documents">
                            <button id="add-document-btn" onClick={() => btnText === "Edit Details" ? "" : document.getElementById("add-document-input").click()}>{btnText === "Edit Details" ? "Documents" : "Add Documents"}</button>
                            <input type="file" id="add-document-input" multiple style={{display: "none"}} onChange={(e) => {
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
                            }}/>
                            {documents.map(doc => <CustomFile file={doc} />)}
                        </section>
                        {props.dor.toString() === "Invalid Date" 
                        ? <section className="add-staff-submit">
                            <button className="add-staff-btn" id="view-btn" onClick={() => {
                                if (btnText === "Update Details"){
                                    initiateSubmit()
                                }
                                Array.from(document.getElementsByClassName("details-input")).forEach(elem => {
                                    elem.disabled = !elem.disabled
                                })
                                if (btnText === "Edit Details"){
                                    setBtnText("Update Details")
                                }
                            }}>{btnText}</button>
                        </section>
                        :
                        ""
                        }
                        {/* <section className="add-staff-input-wrapper">
                            <section>
                                <label>Name <span className="compulsory">*</span></label>
                                <input type="text" id="staff-name-input" />
                            </section>
                            <section id="image-section">
                                <label>Staff Image <span className="compulsory">*</span></label>
                                <input type="file" id="staff-image-input" onChange={(e) => {
                                    const reader = new FileReader()
                                    reader.addEventListener("load", (e) => staffImageRef.current.src = e.target.result)
                                    reader.readAsDataURL(e.target.files[0])
                                }} />
                                <img id="staff-image" ref={staffImageRef} alt="" />
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>ID <span className="compulsory">*</span> (Cannot be changed later)</label>
                                <input type="text" id="staff-id-input" />
                            </section>
                        </section> */}
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <div>
            <div className="staff-main">
                <img src={props.imageSrc} className="staff-img" />
                <span className="staff-name">{props.name}</span>
                <span className="staff-id">{props.id}</span>
                <span className="staff-designation">{props.designation}</span>
                <section className="staff-action-btns">
                    <i className="fi fi-rr-eye" title="View Details" onClick={detailsModalOpen}></i>
                    <i className={props.dor.toString() === "Invalid Date" ? "fi fi-rr-calendar-lines-pen" : "fi fi-rr-calendar-lines-pen resign"} title="Log Attendance" onClick={() => {
                        if (props.dor.toString() !== "Invalid Date") return
                        props.setActiveStaffId(props.id)
                        props.setActiveStaffName(props.name)
                        props.attendanceModalOpen()
                    }}></i>
                    <i className="fi fi-rr-time-past" title="View Past Attendance" onClick={() => {
                        props.setActiveStaffId(props.id)
                        props.setActiveStaffName(props.name)
                        props.historyModalOpen()
                    }}></i>
                    <i className={props.dor.toString() === "Invalid Date" ? "fi fi-rs-exit" : "fi fi-rs-exit resign"} title="Resign" onClick={() => {
                        if (props.dor.toString() !== "Invalid Date") return
                        props.setActiveStaffId(props.id)
                        props.setActiveStaffName(props.name)
                        props.resignStaffModalOpen()
                    }}></i>
                </section>
            </div>
            <StaffDetailsModalPopup />
        </div>
    )
}

function ManageStaff(){
    const [addStaffOpen, setAddStaffOpen] = useState(false)
    const [resignStaffOpen, setResignStaffOpen] = useState(false)
    const [attendanceOpen, setAttendanceOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    // const [detailsOpen, setDetailsOpen] = useState(false)
    // const [canEditDetails, setCanEditDetails] = useState(false)
    const [activeStaffName, setActiveStaffName] = useState("")
    const [activeStaffId, setActiveStaffId] = useState("")
    const [staffData, setStaffData] = useState([])
    const [_staffData, set_StaffData] = useState([])
    const staffImageRef = useRef()

    function addStaffModalOpen(){
        setAddStaffOpen(true)
    }

    function addStaffModalClose(){
        setAddStaffOpen(false)
    }

    function resignStaffModalOpen(){
        setResignStaffOpen(true)
    }

    function resignStaffModalClose(){
        setResignStaffOpen(false)
    }

    function attendanceModalOpen(){
        setAttendanceOpen(true)
    }

    function attendanceModalClose(){
        setAttendanceOpen(false)
    }

    function historyModalOpen(){
        setHistoryOpen(true)
    }

    function historyModalClose(){
        setHistoryOpen(false)
    }

    // function detailsModalOpen(){
    //     setDetailsOpen(true)
    // }

    // function detailsModalClose(){
    //     setDetailsOpen(false)
    // }

    function AddStaffModalPopup(){
        const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        const [name, setName] = useState()
        const [id, setId] = useState()
        const [spm, setSpm] = useState()
        const [designation, setDesignation] = useState()
        const [dob, setDOB] = useState()
        const [bloodGroup, setBloodGroup] = useState("A+")
        const [doa, setDOA] = useState(new Date().toISOString().substring(0, 10))
        const [edu, setEdu] = useState()
        const [phoneNum, setPhoneNum] = useState()
        const [pan, setPan] = useState()
        const [aadhar, setAadhar] = useState()
        const [address, setAddress] = useState()
        const [documents, setDocuments] = useState([])
        const [docsData, setDocsData] = useState({})
        const [test, setTest] = useState(false)
        const [final, setFinal] = useState(false)

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
                    <label className="file-status" id={props.file.name.toLowerCase().replace(" ", "--")}>{status === false ? "Uploading" : <i className="fi fi-rs-trash" onClick={() => {
                        const _docs = documents
                        _docs.forEach(file => {
                            if (file.name === props.file.name){
                                _docs.splice(_docs.indexOf(file), 1)
                            }
                        })
                        setDocuments(_docs)
                        setTest(!test)
                    }}></i>}</label>
                </div>
            )
        }

        function initiateSubmit(){
            if (name === undefined || name === "" || id === undefined || id === "" || spm === undefined || spm === "" || doa === undefined || doa === "" || designation === undefined || designation === "" || dob === undefined || dob === "" || bloodGroup === undefined || bloodGroup === "" || edu === undefined || edu === "" || phoneNum === undefined || phoneNum === "" || phoneNum.length !== 10 || address === undefined || address === "" || staffImageRef.current.src === undefined || staffImageRef.current.src === "" || pan === undefined || pan.length !== 10 || aadhar === undefined || aadhar.length !== 12){
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
                return
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

            const payload = {
                name: name,
                id: id,
                spm: spm,
                designation: designation,
                dob: new Date(dob).getTime() / 1000,
                blood_group: bloodGroup,
                doa: new Date(doa).getTime() / 1000,
                address: address,
                educational_qualifications: edu,
                phone_num: "+91" + phoneNum,
                image: staffImageRef.current.src,
                files: docsData,
                pan: pan,
                aadhar: aadhar
            }

            fetch("http://127.0.0.1:8080/add_staff", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
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
                setTimeout(() => addStaffModalClose(), 2500)
                // setTimeout(() => window.location.reload(), 3000)

            })

            setFinal(false)
        }, [final])

        return (
            <Modal isOpen={addStaffOpen} onRequestClose={addStaffModalClose} contentLabel="Add Staff Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    padding: "0",
                    margin: "0"
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "90vh",
                    width: "auto",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    padding: "0"
                }
            }}>
                <div className="add-staff-main">
                    <div className="add-staff-title">
                        <h1>Add Staff</h1>
                        <i className="fi fi-rr-cross-circle" onClick={addStaffModalClose}></i>
                    </div>
                    <div className="add-staff-inputs">
                        <section className="add-staff-input-wrapper-row">
                            <section className="add-staff-input-sec1">
                                <section>
                                    <label>Name <span className="compulsory">*</span></label>
                                    <input type="text" id="staff-name-input" value={name} onChange={(e) => setName(e.target.value)}/>
                                </section>
                                <section>
                                    <label>ID <span className="compulsory">*</span> (Cannot be changed later)</label>
                                    <input type="text" id="staff-id-input" value={id} onChange={(e) => setId(e.target.value)}/>
                                </section>
                                <section>
                                    <label>SPM <span className="compulsory">*</span></label>
                                    <section>
                                        <span>₹ </span>
                                        <input type="number" id="staff-spm-input" value={spm} onChange={(e) => setSpm(e.target.value)} />
                                    </section>
                                </section>
                            </section>
                            <section className="add-staff-input-sec2">
                                <section>
                                    <label>Staff Image <span className="compulsory">*</span></label>
                                    <input type="file" id="staff-image-input" onChange={(e) => {
                                        const reader = new FileReader()
                                        reader.addEventListener("load", (e) => staffImageRef.current.src = e.target.result)
                                        reader.readAsDataURL(e.target.files[0])
                                    }} />
                                    <img id="staff-image" ref={staffImageRef} alt="" />
                                </section>
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Date of Appointment <span className="compulsory">*</span></label>
                                <input type="date" id="staff-doa-input" value={doa} onChange={(e) => setDOA(e.target.value)} />
                            </section>
                            <section>
                                <label>Designation <span className="compulsory">*</span></label>
                                <input type="text" id="staff-designation-input" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                            </section>
                            <section>
                                <label>Date of Birth <span className="compulsory">*</span></label>
                                <input type="date" id="staff-dob-input" value={dob} onChange={(e) => setDOB(e.target.value)} />
                            </section>
                            <section>
                                <label>Blood Group <span className="compulsory">*</span></label>
                                <select id="staff-blood-group-input" onChange={(e) => setBloodGroup(e.target.value)} defaultValue={bloodGroup}>
                                    {bloodGroups.map(bg => <option value={bg}>{bg}</option>)}
                                </select>
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Educational Qualifications <span className="compulsory">*</span></label>
                                <input type="text" id="staff-edu-input" value={edu} onChange={(e) => setEdu(e.target.value)} />
                            </section>
                            <section>
                                <label>Phone Number <span className="compulsory">*</span></label>
                                <section>
                                    <span>+91 </span>
                                    <input type="number" id="staff-phone-num-input" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} />
                                </section>
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>PAN Number <span className="compulsory">*</span></label>
                                <input type="text" id="staff-pan-input" value={pan} onChange={(e) => setPan(e.target.value)} />
                            </section>
                            <section>
                                <label>Aadhar Number <span className="compulsory">*</span></label>
                                <input type="text" id="staff-aadhar-input" value={aadhar} onChange={(e) => setAadhar(e.target.value)} />
                            </section>
                        </section>
                        <section className="add-staff-input-wrapper">
                            <section>
                                <label>Address <span className="compulsory">*</span></label>
                                <textarea id="staff-address-input" value={address} onChange={(e) => setAddress(e.target.value)} rows="3"/>
                            </section>
                        </section>
                        <section className="add-staff-documents">
                            <button id="add-document-btn" onClick={() => document.getElementById("add-document-input").click()}>Add Documents</button>
                            <input type="file" id="add-document-input" multiple style={{display: "none"}} onChange={(e) => {
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
                            }}/>
                            {documents.map(doc => <CustomFile file={doc} />)}
                        </section>
                        <section className="add-staff-submit">
                            <button className="add-staff-btn" onClick={initiateSubmit}>Add Staff</button>
                        </section>
                    </div>
                </div>
            </Modal>
        )
    }

    function ResignStaffModalPopup(){
        const [resignDate, setResignDate] = useState(new Date(new Date().getTime() + (new Date().getTimezoneOffset() / -60 * 3600000)))

        function resign(){
            const payload = {
                id: activeStaffId,
                time: resignDate.getTime() / 1000
            }

            fetch("http://127.0.0.1:8080/remove_staff", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
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
                setTimeout(() => resignStaffModalClose(), 2500);
                setTimeout(() => window.location.reload(), 3000)
                return
            })
        }
        return (
            <Modal isOpen={resignStaffOpen} onRequestClose={resignStaffModalClose} contentLabel="Resign Staff Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    padding: "0",
                    margin: "0"
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "auto",
                    width: "auto",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    padding: "0"
                }
            }}>
                <div className="resign-staff-main">
                    <div className="resign-staff-title">
                        <h1>Resign Staff</h1>
                        <i className="fi fi-rr-cross-circle" onClick={resignStaffModalClose}></i>
                    </div>
                    <div className="resign-staff-text">
                        <section>
                            <p>Staff ID: <span className="orange">{activeStaffId}</span></p>
                            <p>Staff Name: <span className="orange">{activeStaffName}</span></p>
                        </section>
                        <section>
                            <label>Resign Date & Time: </label>
                            <input type="datetime-local" max={new Date().toJSON().substring(0, 16)} value={resignDate.toJSON().substring(0, 16)} onChange={(e) => setResignDate(new Date(e.target.valueAsNumber))} />
                        </section>
                        <section>
                            <button id="resign-staff-btn" onClick={resign}>Resign</button>
                        </section>
                    </div>
                </div>
            </Modal>
        )
    }

    function AttendanceModalPopup(){
        const [attendanceType, setAttendanceType] = useState("present")
        const [leaveType, setLeaveType] = useState("sick")
        const formatDate = new Date().toLocaleDateString().split("/").map(i => i.length === 1 ? "0" + i : i).join("/")

        const payload = {
            id: activeStaffId,
            status: attendanceType
        }

        if (attendanceType === "absent"){
            payload.leave_type = leaveType
        }

        function logAttendance(){
            fetch("http://127.0.0.1:8080/staff_attendance", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
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
                setTimeout(() => attendanceModalClose(), 2500)
            })
        }

        return (
            <Modal isOpen={attendanceOpen} onRequestClose={attendanceModalClose} contentLabel="Attendance Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    padding: "0",
                    margin: "0"
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "auto",
                    width: "auto",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    padding: "0"
                }
            }}>
                <div className="attendance-main">
                    <div className="attendance-title">
                        <h1>Log Attendance</h1>
                        <i className="fi fi-rr-cross-circle" onClick={attendanceModalClose}></i>
                    </div>
                    <div className="attendance-text">
                        <section className="attendance-details">
                            <p>Staff ID: <span className="orange">{activeStaffId}</span></p>
                            <p>Staff Name: <span className="orange">{activeStaffName}</span></p>
                            <p>Log Date: <span className="orange">{formatDate}</span></p>
                        </section>
                        <section className="attendance-input">
                            <label>Attendance</label>
                            <select value={attendanceType} onChange={(e) => {
                                setAttendanceType(e.target.value)
                                if (e.target.value === "absent"){
                                    document.getElementById("leave-type-select").disabled = false
                                } else {
                                    document.getElementById("leave-type-select").disabled = true
                                }
                            }}>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
                        </section>
                        <section className="attendance-input">
                            <label>Leave Type</label>
                            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} id="leave-type-select" disabled>
                                <option value="sick">Sick Leave</option>
                                <option value="casual">Casual Leave</option>
                                <option value="special">Special Leave</option>
                            </select>
                        </section>
                        <section>
                            <button id="attendance-btn" onClick={logAttendance}>Log Attendance</button>
                        </section>
                    </div>
                </div>
            </Modal>
        )
    }

    useEffect(() => {
        fetch("http://127.0.0.1:8080/staff", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === true){
                setStaffData(data.staff_data.filter(staff => staff.dor === "-"))
                set_StaffData(data.staff_data)
            }
        })
    }, [addStaffOpen])

    function onSearch(searchQuery, salaryFrom, salaryTo, designation, bloodGroup, doa, dor, dateFrom, dateTo){
        const filteredStaff = _staffData.filter(staff => {
            staff.doa = parseInt(staff.doa)
            return (
                (staff.spm >= salaryFrom && staff.spm <= salaryTo && ((dor === "" && dateFrom === 0 && dateTo === Infinity) ? staff.dor === "-" : true)) && 
                (designation === "all" ? true : staff.designation === designation && ((dor === "" && dateFrom === 0 && dateTo === Infinity) ? staff.dor === "-" : true)) &&
                (searchQuery === "" ? true : staff.name.includes(searchQuery) && ((dor === "" && dateFrom === 0 && dateTo === Infinity) ? staff.dor === "-" : true)) &&
                (bloodGroup === "all" ? true : staff.blood_group === bloodGroup && ((dor === "" && dateFrom === 0 && dateTo === Infinity) ? staff.dor === "-" : true)) &&
                (doa === "" ? true : (new Date(staff.doa*1000).toISOString().substring(0, 10) === new Date(doa*1000).toISOString().substring(0, 10))) &&
                (dor === "" ? true : (staff.dor !== "-" && new Date(staff.dor*1000).toISOString().substring(0, 10) === new Date(dor*1000).toISOString().substring(0, 10))) &&
                (dateFrom === 0 ? true : (staff.doa >= dateFrom && (staff.dor === "-" ? true : staff.dor <= dateTo)))
            )
        })
        setStaffData(filteredStaff)
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
            <Sidebar active="manage-staff" />
            <div className="manage-staff-main">
                <div className="manage-staff-title">
                    <h1>Manage <span className="orange">Staff</span></h1>
                </div>
                <div className="staff-search">
                    <CustomSearch onSearch={onSearch} />
                    <div className="add-staff-btn" onClick={addStaffModalOpen}>
                        <i className="fi fi-br-plus"></i>
                        <span>Add Staff</span>
                    </div>
                </div>
                <div className="staff-block">
                    {staffData.map(staff => <Staff name={staff.name} id={staff.id} spm={staff.spm} sick_leaves={staff.sick_leaves} casual_leaves={staff.casual_leaves} special_leaves={staff.special_leaves} designation={staff.designation} dob={new Date(staff.dob*1000)} blood_group={staff.blood_group} doa={new Date(staff.doa*1000)} dor={new Date(staff.dor*1000)} address={staff.address} educational_qualifications={staff.educational_qualifications} phone_num={staff.phone_num} imageSrc={staff.image} pan={staff.pan} aadhar={staff.aadhar} resignStaffModalOpen={resignStaffModalOpen} setActiveStaffName={setActiveStaffName} setActiveStaffId={setActiveStaffId} attendanceModalOpen={attendanceModalOpen} historyModalOpen={historyModalOpen} />)}
                </div>
            </div>
            <AddStaffModalPopup />
            <ResignStaffModalPopup />
            <AttendanceModalPopup />
            <HistoryModalPopup isOpen={historyOpen} close={historyModalClose} id={activeStaffId} name={activeStaffName} />
            <ToastContainer />
        </div>
    )
}

export default ManageStaff;
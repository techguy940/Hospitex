import './css/staffpayments.css';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Modal from 'react-modal';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './sidebar.js';



function AddPaymentModalPopup(props){
    const [paymentType, setPaymentType] = useState("salary")
    const [salaryMonth, setSalaryMonth] = useState("")
    const [spm, setSpm] = useState(0)
    const [advance, setAdvance] = useState(0)
    const [amount, setAmount] = useState(0)
    const [total, setTotal] = useState("")
    
    useEffect(() => {
        setSalaryMonth(props.activeStaffId !== "" ? props.activeStaffDor.toString() === "Invalid Date" ? new Date().toISOString().substring(0, 7) : props.activeStaffDor.toISOString().substring(0, 7) : "")
    }, [props.activeStaffId])

    useEffect(() => {
        const [month, year] = salaryMonth.split("-").reverse()
        if (paymentType === "salary"){
            fetch("http://127.0.0.1:8080/staff_salary_data", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: props.activeStaffId, month: month, year: year})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
                    setSpm(data.spm)
                    setAdvance(data.advance)
                    setAmount(data.to_pay)
                }
            })
        }
    }, [paymentType, salaryMonth])

    useEffect(() => setTotal(parseFloat(advance) + parseFloat(amount)), [advance, amount])

    function addPayment(){
        const [month, year] = salaryMonth.split("-").reverse()
        const payload = {
            id: props.activeStaffId,
            status: paymentType,
            month: month,
            year: year
        }
        if (paymentType !== "salary"){
            payload.amount = amount
        }

        fetch("http://127.0.0.1:8080/staff_salary", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
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
            setTimeout(() => props.close(), 2500)
        })
    }

    return (
        <Modal isOpen={props.isOpen} onRequestClose={props.close} contentLabel="Add Payment Modal" style={{
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
            <div className="add-payment-main">
                <div className="add-payment-title">
                    <h1>Add Payment</h1>
                    <i className="fi fi-rr-cross-circle" onClick={props.close}></i>
                </div>
                <div className="add-payment-text">
                    <p>Staff ID: <span className="staff-id orange">{props.activeStaffId}</span></p>
                    <p>Staff Name: <span className="staff-name orange">{props.activeStaffName}</span></p>
                </div>
                <div className="add-payment-inputs">
                    <div className="add-payment-input">
                        <label>Payment Type <span className="compulsory">*</span></label>
                        {
                            props.activeStaffDor.toString() === "Invalid Date"
                            ? <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                <option value="salary">Salary</option>
                                <option value="advance">Advance</option>
                                <option value="bonus">Bonus</option>
                            </select>
                            : <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                <option value="salary">Salary</option>
                                <option value="advance" disabled>Advance</option>
                                <option value="bonus"disabled>Bonus</option>
                            </select>
                        }
                    </div>
                    <div className="add-payment-input">
                        <label>Salary Month <span className="compulsory">*</span></label>
                        {
                            props.activeStaffDor.toString() === "Invalid Date"
                            ? <input value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} type="month" />
                            : <input value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} max={salaryMonth} type="month" />
                        }
                    </div>
                    <div className="add-payment-input">
                        <label>Amount <span className="compulsory">*</span></label>
                        {
                            paymentType === "salary"
                            ? (
                                <div className="salary-data">
                                    <section>
                                        <label>Salary: </label>
                                        <span>₹</span>
                                        <input type="number" value={spm} disabled />
                                    </section>
                                    <section>
                                        <label>Advance: </label>
                                        <span>₹</span>
                                        <input type="number" value={advance} disabled />
                                    </section>
                                    <section>
                                        <label>To Pay: </label>
                                        <span>₹</span>
                                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    </section>
                                    <section>
                                        <label>Total: </label>
                                        <span>₹</span>
                                        <input type="number" value={total} disabled />
                                    </section>
                                </div>
                            )
                            : (
                                <section className="amount-input">
                                    <span>₹</span>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </section>
                            )
                        }
                    </div>
                </div>
                <div className="add-payment-btn">
                    <button onClick={addPayment}>Add Payment</button>
                </div>
            </div>
        </Modal>
    )
}

function ReportModalPopup(props){
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [btnText, setBtnText] = useState("Get Report")

    function generateReport(){
        const fromSecs = new Date(from).getTime() / 1000
        const toSecs = new Date(to).getTime() / 1000
        if (fromSecs > toSecs || from === "" || to === ""){
            toast.error("Invalid Dates Given", {
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
        setBtnText("Generating Report...")


        fetch("http://127.0.0.1:8080/generate_staff_report", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: props.activeStaffId, from: fromSecs, to: toSecs})})
        .then(res => res.json())
        .then(data => {
            if (data.status === false){
                setBtnText("Get Report")
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
            const a = document.createElement("a")
            a.href = data.file;
            a.download = "report_" + props.activeStaffId + ".pdf";
            a.click();
            a.remove()
            setBtnText("Get Report")
            setTimeout(() => props.close(), 2500)
        })
    }

    return (
        <Modal isOpen={props.isOpen} onRequestClose={props.close} contentLabel="Payment Report Modal" style={{
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
            <div className="report-main">
                <div className="report-title">
                    <h1>Payment Report</h1>
                    <i className="fi fi-rr-cross-circle" onClick={props.close}></i>
                </div>
                <div className="report-text">
                    <p>Staff ID: <span className="staff-id orange">{props.activeStaffId}</span></p>
                    <p>Staff Name: <span className="staff-name orange">{props.activeStaffName}</span></p>
                </div>
                <div className="report-inputs">
                    <div className="report-input">
                        <label>From <span className="compulsory">*</span></label>
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="report-input">
                        <label>To <span className="compulsory">*</span></label>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                </div>
                <div className="report-btn">
                    <button onClick={generateReport}>{btnText}</button>
                </div>
            </div>
        </Modal>
    )
}

function PayslipModalPopup(props){
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7))
    const [btnText, setBtnText] = useState("Get Payslip")

    function generatePayslip(){
        if (props.activeStaffId === "") return
        setBtnText("Generating Payslip...")
        const [_month, _year] = month.split("-").reverse()
        fetch("http://127.0.0.1:8080/generate_payslip", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: props.activeStaffId, month: _month, year: _year})})
        .then(res => res.json())
        .then(data => {
            if (data.status === false){
                setBtnText("Get Payslip")
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
            const a = document.createElement("a")
            a.href = data.file;
            a.download = "payslip_" + props.activeStaffId + ".pdf";
            a.click();
            a.remove()
            setBtnText("Get Paylslip")
            setTimeout(() => props.close(), 2500)
        })
        
    }

    return (
        <Modal isOpen={props.isOpen} onRequestClose={props.close} contentLabel="Get Payslip Modal" style={{
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
            <div className="payslip-main">
                <div className="payslip-title">
                    <h1>Get Payslip</h1>
                    <i className="fi fi-rr-cross-circle" onClick={props.close}></i>
                </div>
                <div className="payslip-text">
                    <p>Staff ID: <span className="staff-id orange">{props.activeStaffId}</span></p>
                    <p>Staff Name: <span className="staff-name orange">{props.activeStaffName}</span></p>
                </div>
                <div className="payslip-inputs">
                    <div className="payslip-input">
                        <label>Month <span className="compulsory"> *</span></label>
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </div>
                </div>
                <div className="payslip-btn">
                    <button onClick={generatePayslip}>{btnText}</button>
                </div>
            </div>
        </Modal>
    )
}


function Staff(props){
    return (
        <div className="staff-main">
            <img src={props.imageSrc} className="staff-img" />
            <span className="staff-name">{props.name}</span>
            <span className="staff-id">{props.id}</span>
            <span className={props.dor.toString() === "Invalid Date" ? "staff-designation" : "staff-designation resigned"}>{props.dor.toString() === "Invalid Date" ? props.designation : "Resigned"}</span>
            <section className="staff-action-btns">
                <i className="fi fi-rs-money-bill-wave" title="Add Payment" onClick={() => {
                    props.addPaymentModalOpen()
                    props.setActiveStaffId(props.id)
                    props.setActiveStaffName(props.name)
                    props.setActiveStaffDor(props.dor)
                }}></i>
                <i className="fi fi-rr-document" title="Get Payment Report" onClick={() => {
                    props.reportModalOpen()
                    props.setActiveStaffId(props.id)
                    props.setActiveStaffName(props.name)
                    props.setActiveStaffDor(props.dor)
                }}></i>
                <i className="fi fi-rr-money-check" title="Get Payslip" onClick={() => {
                    props.payslipModalOpen()
                    props.setActiveStaffId(props.id)
                    props.setActiveStaffName(props.name)
                    props.setActiveStaffDor(props.dor)
                }}></i>
            </section>
        </div>
    )
}


function StaffPayments(){
    const [staffData, setStaffData] = useState([])
    const [addPaymentOpen, setAddPaymentOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [payslipOpen, setPayslipOpen] = useState(false)
    const [activeStaffId, setActiveStaffId] = useState("")
    const [activeStaffName, setActiveStaffName] = useState("")
    const [activeStaffDor, setActiveStaffDor] = useState("")

    function addPaymentModalOpen(){
        setAddPaymentOpen(true)
    }

    function addPaymentModalClose(){
        setAddPaymentOpen(false)
    }

    function reportModalOpen(){
        setReportOpen(true)
    }

    function reportModalClose(){
        setReportOpen(false)
    }

    function payslipModalOpen(){
        setPayslipOpen(true)
    }

    function payslipModalClose(){
        setPayslipOpen(false)
    }

    useEffect(() => {
        fetch("http://127.0.0.1:8080/staff_brief", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            setStaffData(data.staff_data)
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
            <Sidebar active="staff-payments" />
            <div className="staff-payments-parent">
                <div className="staff-payments-title">
                    <h1>Staff <span className="orange">Payments</span></h1>
                </div>
                <div className="staff-payments-main">
                    {staffData.map(staff => <Staff name={staff.name} id={staff.id} dor={new Date(staff.dor*1000)} imageSrc={staff.image} designation={staff.designation} addPaymentModalOpen={addPaymentModalOpen} reportModalOpen={reportModalOpen} payslipModalOpen={payslipModalOpen} setActiveStaffId={setActiveStaffId} setActiveStaffName={setActiveStaffName} setActiveStaffDor={setActiveStaffDor} />)}
                </div>
            </div>
            <ToastContainer />
            <AddPaymentModalPopup isOpen={addPaymentOpen} close={addPaymentModalClose} activeStaffId={activeStaffId} activeStaffName={activeStaffName} activeStaffDor={activeStaffDor} />
            <ReportModalPopup isOpen={reportOpen} close={reportModalClose} activeStaffId={activeStaffId} activeStaffName={activeStaffName} activeStaffDor={activeStaffDor} />
            <PayslipModalPopup isOpen={payslipOpen} close={payslipModalClose} activeStaffId={activeStaffId} activeStaffName={activeStaffName} activeStaffDor={activeStaffDor} />
        </div>
    )
}

export default StaffPayments;
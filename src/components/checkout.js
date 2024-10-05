import './css/checkout.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify';
import Modal from 'react-modal';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './sidebar.js';


function Room(props){
    return (
        <div className={props.booked ? "room" : "room lock"}>
            {props.booked ? <div className="gray">
                <i className="fi fi-ss-sign-out-alt" onClick={() => {
                    props.setTxnId(props.txn_id)
                    props.modalOpen()
                }}></i>
            </div> : ""}
            {/* <div className="gray">
                {/* <i className="fi fi-rr-pen-circle" id="edit-room-btn" onClick={() => {
                    props.setModifyRoomNum(props.room_num)
                    props.setModifyFloorNum(props.floor_num)
                    props.modifyModalOpen()
                    console.log("DONE")
                }}></i>
                <i className="fi fi-rs-trash" id="delete-room-btn" onClick={() => {
                    props.setDeleteRoomNum(props.room_num)
                    props.setDeleteFloorNum(props.floor_num)
                    props.deleteModalOpen()
                }}></i> */}
            {/* </div> */}
            <section className="room-number">{props.room_num}</section>
            <section className="room-type">{props.booked ? props.name : props.type}</section>
            <section className="room-capacity"><i className="fi fi-sr-user"></i>{"  " + props.capacity.toString()}</section>
            <section className="room-ppn orange bold">{"₹ " + props.ppn.toString()}</section>
        </div>
    )
}

function Floor(props){
    const [rooms, setRooms] = useState([])
    useEffect(() => {
        fetch("http://127.0.0.1:8080/rooms", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({floor_num: props.floor_num})})
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
            fetch("http://127.0.0.1:8080/occupied_rooms", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({from: (new Date().getTime())/1000, to: (new Date().getTime())/1000 + 86400})})
            .then(res2 => res2.json())
            .then(data2 => {
                const roomData = data.rooms[props.floor_num.toString()]
                const occupiedRooms = data2.occupied_rooms
                occupiedRooms.forEach(occupiedRoom => {
                    roomData.forEach(room => {
                        if (room.booked !== true){
                            if (occupiedRoom.room_num === room.room_num){
                                room.booked = true
                                room.name = occupiedRoom.name
                                room.ppn = occupiedRoom.ppn
                                room.txn_id = occupiedRoom.txn_id
                            } else {
                                room.booked = false
                            }
                        }
                    })
                })
                // roomData.forEach(room => {
                //     occupiedRooms.forEach(occupiedRoom => {
                //         if (occupiedRoom.room_num === room.room_num){
                //             room.booked = true
                //             room.name = occupiedRoom.name
                //             room.ppn = occupiedRoom.ppn
                //             room.txn_id = occupiedRoom.txn_id
                //         } else {
                //             room.booked = false
                //         }
                //     })
                // })
                setRooms(data.rooms[props.floor_num.toString()])
                // setRooms(data.rooms[props.floor_num.toString()])
            })
        })
    }, [])
    return (
        (props.filterType === "All" || rooms.filter(room => room.type === props.filterType).length !== 0) ? (<div className="floor">
            <div className="floor-title">
                <section className="floor-number">{"Floor " + props.floor_num}</section>
            </div>
            <div className="rooms">
                {props.filterType === "All"
                ? rooms.map(room => <Room room_num={room.room_num} ppn={room.ppn} capacity={room.capacity} type={room.type} floor_num={props.floor_num} booked={room.booked} name={room.name} />)
                : rooms.filter(room => room.type === props.filterType).map(room => <Room room_num={room.room_num} ppn={room.ppn} capacity={room.capacity} type={room.type} floor_num={props.floor_num} booked={room.booked} name={room.name} />)}
            </div>
        </div>) : ""  
    )
}


function Checkout(){
    const [floors, setFloors] = useState([])
    const [roomTypes, setRoomTypes] = useState([])
    const [open, setOpen] = useState(false)
    const [invoiceOpen, setInvoiceOpen] = useState(false)
    const [txnId, setTxnId] = useState("")
    const [filterFloor, setFilterFloor] = useState("All")
    const [filterType, setFilterType] = useState("All")

    function modalOpen(){
        setOpen(true)
    }
    function modalClose(){
        setOpen(false)
    }

    function invoiceModalOpen(){
        setInvoiceOpen(true)
    }
    function invoiceModalClose(){
        setInvoiceOpen(false)
    }

    

    useEffect(() => {
        fetch("http://127.0.0.1:8080/floors", {method: "GET", credentials: "include"})
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
            setFloors(data.floors)
        })
        fetch("http://127.0.0.1:8080/room_types", {method: "GET", credentials: "include"})
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
            setRoomTypes(data.room_types)
        })
    }, [])

    function CheckoutModalPopup(){
        function checkoutRoom(){
            if (txnId === ""){
                return
            }
    
            fetch("http://127.0.0.1:8080/checkout", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({txn_id: txnId})})
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
                    modalClose();
                    return
                }
                modalClose()
                invoiceModalOpen()
            })
        }
        return (
            <Modal isOpen={open} onRequestClose={modalClose} contentLabel="Checkout Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    padding: "0",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "21.9vh",
                    width: "30%",
                    padding: "0",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)'
                }
            }}>
                <div className="checkout-modal">
                    <section className="checkout-modal-title">
                        <h1>Checkout</h1>
                        <i className="fi fi-rr-cross-circle" onClick={modalClose}></i>
                    </section>
                    <section className="checkout-text">
                        <p>Do you want to <span className="orange bold">checkout</span>?</p>
                    </section>
                    <section className="checkout-btns">
                        <div id="go-back" onClick={modalClose}>Go Back</div>
                        <div id="checkout-btn" onClick={checkoutRoom}>Checkout</div>
                    </section>
                </div>
            </Modal>
        )
    }

    function InvoiceModalPopup(){
        const [invoiceText, setInvoiceText] = useState("Download Invoice")
        function downloadInvoice(){
            setInvoiceText("Generating Invoice...")
            fetch("http://127.0.0.1:8080/generate_invoice", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({txn_id: txnId})})
            .then(res => res.json())
            .then(data => {
                const a = document.createElement("a")
                a.href = data.file;
                a.download = txnId + ".pdf";
                a.click();
                a.remove()
                setInvoiceText("Download Invoice")
                invoiceModalClose()
                window.location.reload()
            })
        }
        return (
            <Modal isOpen={invoiceOpen} onRequestClose={invoiceModalClose} contentLabel="Invoice Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    padding: "0",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "21.9vh",
                    width: "30%",
                    padding: "0",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)'
                }
            }}>
                <div className="invoice-modal">
                    <div className="invoice-text">
                        <i className="fi fi-rs-check-circle"></i>
                        <h1>Checkout successful</h1>
                    </div>
                    <div className="download-invoice-btn" onClick={downloadInvoice}>
                        <i class="fi fi-rr-arrow-small-down"></i>
                        <p>{invoiceText}</p>
                    </div>
                </div>
            </Modal>
        )
    }
    const navigate = useNavigate();
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
            <Sidebar active="checkout" />
            <div className="checkout-main">
                <div className="checkout-title">
                    <h1 className="orange">Check out</h1>
                </div>
                <div className="filter-options">
                    <section>
                        <label>Floor Number: </label>
                        <select value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
                            <option value="All">All</option>
                            {floors.map(floor => <option value={floor}>{floor}</option>)}
                        </select>
                    </section>
                    <section>
                        <label>Room Type: </label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="All">All</option>
                            {roomTypes.map(roomType => <option value={roomType}>{roomType}</option>)}
                        </select>
                    </section>
                </div>
                <div className="floors-main">
                {filterFloor === "All"
                ? floors.map(floor => <Floor floor_num={floor} modalOpen={modalOpen} setTxnId={setTxnId} filterType={filterType} />)
                : floors.filter(floor => floor.toString() === filterFloor.toString()).map(floor => <Floor floor_num={floor} modalOpen={modalOpen} setTxnId={setTxnId} filterType={filterType} />)}
                </div>
            </div>
            <ToastContainer />
            <CheckoutModalPopup />
            <InvoiceModalPopup />
        </div>
    )
}

export default Checkout;
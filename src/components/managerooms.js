import './css/managerooms.css';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import CustomSelect from './customselect.js';
import {RupeeInput} from './forminputs.js';
import Sidebar from './sidebar.js';


function Room(props){
    return (
        <div className="room">
            <div className="gray">
                <i className="fi fi-rr-pen-circle" id="edit-room-btn" onClick={() => {
                    props.setModifyRoomNum(props.room_num)
                    props.setModifyFloorNum(props.floor_num)
                    props.modifyModalOpen()
                    console.log("DONE")
                }}></i>
                <i className="fi fi-rs-trash" id="delete-room-btn" onClick={() => {
                    props.setDeleteRoomNum(props.room_num)
                    props.setDeleteFloorNum(props.floor_num)
                    props.deleteModalOpen()
                }}></i>
            </div>
            <section className="room-number">{props.room_num}</section>
            <section className="room-type">{props.type}</section>
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
            setRooms(data.rooms[props.floor_num.toString()])
            
        })
    }, [])
    return (
        <div className="floor">
            <div className="floor-title">
                <section className="floor-number">{"Floor " + props.floor_num}</section>
            </div>
            <div className="rooms">
                {rooms.map(room => <Room room_num={room.room_num} ppn={room.ppn} capacity={room.capacity} type={room.type} floor_num={props.floor_num} />)}
            </div>
        </div>    
    )
}

function ManageRooms(){
    const [floors, setFloors] = useState([])
    const [addRoom, setAddRoom] = useState(false)
    const [deleteRoom, setDeleteRoom] = useState(false)
    const [modifyRoom, setModifyRoom] = useState(false)
    const [roomTypes, setRoomTypes] = useState([])
    const [deleteRoomNum, setDeleteRoomNum] = useState("")
    const [deleteFloorNum, setDeleteFloorNum] = useState("")
    const [modifyRoomNum, setModifyRoomNum] = useState("")
    const [modifyFloorNum, setModifyFloorNum] = useState("")
    const [modifyRoomPpn, setModifyRoomPpn] = useState("")
    const [modifyRoomType, setModifyRoomType] = useState("")
    const [modifyRoomCapacity, setModifyRoomCapacity] = useState("")

    useEffect(() => {
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

    function addRoomOpen(){
        setAddRoom(true)
    }

    function addRoomClose(){
        setAddRoom(false)
    }

    function deleteRoomOpen(){
        setDeleteRoom(true)
    }

    function deleteRoomClose(){
        setDeleteRoom(false)
    }

    function modifyRoomOpen(){
        setModifyRoom(true)
    }

    function modifyRoomClose(){
        setModifyRoom(false)
    }

    function AddRoomModalPopup(props){
        const [roomNum, setRoomNum] = useState("")
        const [floorNum, setFloorNum] = useState("")
        const [capacity, setCapacity] = useState("")
        const [ppn, setPpn] = useState("")
        const [type, setType] = useState("")
        
        function addRoomFunc(){
            if (roomNum === "" || floorNum === null || capacity.value === "" || ppn === "" || type === null || floorNum === "" || type === ""){
                toast.error("Input data invalid", {
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
            fetch("http://127.0.0.1:8080/add_room", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({room_num: roomNum, floor_num: floorNum.value, capacity: capacity, type: type.value, ppn: ppn})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
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
                    setTimeout(() => addRoomClose(), 2500)
                    setTimeout(() => window.location.reload(), 3000)
                } else if (data.status === false){
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
                }
            })
        }
        

        return (
            <Modal isOpen={addRoom} onRequestClose={addRoomClose} contentLabel="Add Room Modal" style={{
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
                    height: "52vh",
                    width: "40%",
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
                <div className="add-room-modal">
                    <section className="add-room-title">
                        <h1>Add Room</h1>
                        <i className="fi fi-rr-cross-circle" onClick={addRoomClose}></i>
                    </section>
                    <section className="add-room-inputs">
                        <section>
                            <label>Room Number <span className="compulsory">*</span></label>
                            <input className="room-num-input" type="number" value={roomNum} onChange={(e) => setRoomNum(e.target.value)} min="0" />
                        </section>
                        <section>
                            <label>Floor Number <span className="compulsory">*</span></label>
                            <CustomSelect value={floorNum} setValue={setFloorNum} defaultOptions={floors.map(floor => {
                                return {label: floor, value: floor}
                            })}/>
                        </section>
                        <section>
                            <label>Room Type <span className="compulsory">*</span></label>
                            <CustomSelect value={type} setValue={setType} defaultOptions={props.roomTypes.map(type => {
                                return {label: type, value: type}
                            })}/>
                        </section>
                        <section>
                            <label>Capacity <span className="compulsory">*</span></label>
                            <input className="capacity-input" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="0" />
                        </section>
                        <section className="final-section">
                            <RupeeInput className="room-ppn" id="room-ppn" labelText="Price per night" inputType="number" value={ppn} setFunc={setPpn} compulsory/>
                            <button onClick={addRoomFunc}>Add Room</button>
                        </section>
                    </section>
                </div>
            </Modal>
        )
    }

    function ModifyRoomModalPopup(props){
        const roomNum = props.roomNum
        const floorNum = props.floorNum
        const [capacity, setCapacity] = useState(props.capacity)
        const [ppn, setPpn] = useState(props.ppn)
        const [type, setType] = useState(props.type)
        
        function modifyRoomFunc(){
            if (roomNum === "" || floorNum === null || capacity.value === "" || ppn === "" || type === null || floorNum === "" || type === ""){
                toast.error("Input data invalid", {
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
            fetch("http://127.0.0.1:8080/modify_room", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({room_num: roomNum, floor_num: floorNum, capacity: capacity, type: type, ppn: ppn})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
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
                    setTimeout(() => addRoomClose(), 2500)
                    setTimeout(() => window.location.reload(), 3000)
                } else if (data.status === false){
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
                }
            })
        }
        

        return (
            <Modal isOpen={modifyRoom} onRequestClose={modifyRoomClose} contentLabel="Modify Room Modal" style={{
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
                    height: "52vh",
                    width: "40%",
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
                <div className="modify-room-modal">
                    <section className="modify-room-title">
                        <h1>Modify Room</h1>
                        <i className="fi fi-rr-cross-circle" onClick={modifyRoomClose}></i>
                    </section>
                    <section className="modify-room-inputs">
                        <section>
                            <label>Room Number <span className="compulsory">*</span></label>
                            <input className="room-num-input" type="number" value={props.roomNum} min="0" disabled/>
                        </section>
                        <section>
                            <label>Floor Number <span className="compulsory">*</span></label>
                            <input className="floor-num-input" type="number" value={props.floorNum} min="0" disabled/>
                        </section>
                        <section>
                            <label>Room Type <span className="compulsory">*</span></label>
                            <CustomSelect value={{label: type, value: type}} setValue={(e) => {
                                if (e === null){
                                    setType("")
                                } else {
                                    setType(e.value)
                                }
                            }} defaultOptions={props.roomTypes.map(type => {
                                return {label: type, value: type}
                            })}/>
                        </section>
                        <section>
                            <label>Capacity <span className="compulsory">*</span></label>
                            <input className="capacity-input" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="0" />
                        </section>
                        <section className="final-section">
                            <RupeeInput className="room-ppn" id="room-ppn" labelText="Price per night" inputType="number" value={ppn} setFunc={setPpn} compulsory/>
                            <button onClick={modifyRoomFunc}>Modify Details</button>
                        </section>
                    </section>
                </div>
            </Modal>
        )
    }

    function DeleteRoomModalPopup(){
        function deleteRoomFunc(){
            fetch("http://127.0.0.1:8080/delete_room", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({room_num: deleteRoomNum, floor_num: deleteFloorNum})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
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
                    setTimeout(() => window.location.reload(), 2500)
                } else if (data.status === false){
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
                }
            })
        }
        return (
            <Modal isOpen={deleteRoom} onRequestClose={deleteRoomClose} contentLabel="Delete Room Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    marginBottom: "0",
                    padding: "0",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    overflow: "hidden"
                    
                },
                content: {
                    overflow: "hidden",
                    backgroundColor: "white",
                    height: "20.8vh",
                    width: "30%",
                    padding: "0",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    marginBottom: "0",
                    transform: 'translate(-50%, -50%)'
                }
            }}>
                <div className="delete-room-modal">
                    <div className="delete-room-title">
                        <h1>Delete Room</h1>
                        <i className="fi fi-rr-cross-circle" onClick={deleteRoomClose}></i>
                    </div>
                    <div className="delete-room-text">
                        <p>Are you sure you want to delete this room?</p>
                    </div>
                    <div className="delete-room-btns">
                        <button id="go-back-btn" onClick={deleteRoomClose}>Go Back</button>
                        <button id="delete-btn" onClick={deleteRoomFunc}>Delete Room</button>
                    </div>
                </div>
            </Modal>
        )
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
    }, [])

    useEffect(() => {
        if (modifyFloorNum === "" || modifyRoomNum === ""){
            return
        }
        fetch("http://127.0.0.1:8080/room", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({room_num: modifyRoomNum, floor_num: modifyFloorNum})})
        .then(res => res.json())
        .then(data => {
            console.log(data)
            if (data.status === true){
                setModifyRoomCapacity(data.data.capacity)
                setModifyRoomPpn(data.data.ppn)
                setModifyRoomType(data.data.type)
                modifyRoomOpen()
            }
        })
    }, [modifyFloorNum, modifyRoomNum])
    
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
            <Sidebar active="manage-rooms" />
            <div className="manage-rooms-main">
                <div className="manage-rooms-title">
                    <h1>Manage <span className="orange">Rooms</span></h1>
                </div>
                <div className="add-room" onClick={addRoomOpen}>
                    <div className="add-room-btn"><i className="fi fi-rr-add"></i>Add Room</div>
                </div>
                <div className="floors-main">
                    {floors.map(floor => <Floor floor_num={floor} deleteModalOpen={deleteRoomOpen} setDeleteRoomNum={setDeleteRoomNum} setDeleteFloorNum={setDeleteFloorNum} modifyModalOpen={modifyRoomOpen} setModifyFloorNum={setModifyFloorNum} setModifyRoomNum={setModifyRoomNum} />)}
                </div>
            </div>
            <ToastContainer />
            <AddRoomModalPopup roomTypes={roomTypes} />
            <DeleteRoomModalPopup />
            <ModifyRoomModalPopup roomTypes={roomTypes} roomNum={modifyRoomNum} floorNum={modifyFloorNum} ppn={modifyRoomPpn} capacity={modifyRoomCapacity} type={modifyRoomType} />
        </div>
    )
}

export default ManageRooms;
import './css/checkin.css';
import { useNavigate } from 'react-router-dom';
import {useState, useEffect, useRef} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import Modal from 'react-modal';
import 'react-toastify/dist/ReactToastify.css';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import Sidebar from './sidebar';

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

const createOption = (label) => ({
  label,
  value: label,
});

function MultiSelect(props){
    const colourStyles = {
        control: (styles) => ({ ...styles, backgroundColor: 'white' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
            ...styles,
            backgroundColor: "white",
            color: "#ff7300",
            cursor: isDisabled ? 'not-allowed' : 'default',
    
            ':active': {
            ...styles[':active'],
            backgroundColor: "white"
            },
        };
        },
        multiValue: (styles, { data }) => {
        return {
            ...styles,
            backgroundColor: "rgba(255, 115, 0, 0.08)",
            border: "2px solid #ff7300",
            borderRadius: "3px",
        };
        },
        multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: "rgba(255, 115, 0, 1)",
        }),
        multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: "black",
        cursor: "pointer",
        ':hover': {
            backgroundColor: "red",
            color: 'white',
        },
        }),
    };
    
    return (
        <Select
            closeMenuOnSelect={false}
            isMulti
            options={props.options}
            styles={colourStyles}
            onChange={(e) => props.setFoodPackages(e)}
        />
    );
}
function CustomSelect(props){
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const colourStyles = {
        control: styles => ({ ...styles, backgroundColor: 'white', width: "auto", borderColor: "var(--primary-color)", minHeight: '35px', height: '35px', padding: "0", fontSize: "14px", borderRadius: "3px"}),
        valueContainer: (provided, state) => ({
            ...provided,
            height: '35px',
            padding: '0 6px'
        }),
      
        input: (provided, state) => ({
            ...provided,
            margin: '0px',
        }),
        indicatorSeparator: state => ({
            display: 'none',
        }),
        indicatorsContainer: (provided, state) => ({
            ...provided,
            height: '35px',
        }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
          return {
            ...styles,
            backgroundColor: isFocused ? "var(--primary-color)" : "white",
            color: isFocused ? "white" : "black",
            cursor: "pointer",
            fontSize: "14px",
          };
        },
      };
    function handleInputChange(newInput){
        if (newInput.trim().length === 0){
            return
        }

        fetch("http://127.0.0.1:8080/unique_customers", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: newInput})})
        .then(res => res.json())
        .then(data => {
            setOptions(data.names.map(name => {
                return {label: name, value: name}
            }))
        })


    }

    const handleCreate = (inputValue) => {
        setIsLoading(true);
        setTimeout(() => {
        const newOption = createOption(inputValue);
        setIsLoading(false);
        setOptions((prev) => [...prev, newOption]);
        props.setValue(newOption);
        }, 1000);
    };
    return (
        <CreatableSelect
            isClearable
            isDisabled={isLoading}
            isLoading={isLoading}
            onChange={(newValue) => {
                if (newValue !== null){
                    fetch("http://127.0.0.1:8080/customer_details", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: newValue.value})})
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === true){
                            if (data.details !== {}){
                                const keys = Object.keys(data.details.documents)
                                if (count === 0){
                                    props.setDocsData(data.details.documents)
                                    props.setDocuments(_docs)
                                    props.setValue(newValue)
                                    return
                                }
                                const _docs = []
                                var count = keys.length
                                keys.forEach(key => {
                                    _docs.push(urltoFile(data.details.documents[key], key, "application/pdf"))
                                    count = count - 1
                                    if (count === 0){
                                        props.setDocsData(data.details.documents)
                                        props.setDocuments(_docs)
                                    }
                                })
                                props.setPhoneNum(parseInt(data.details.phone_num))
                                props.setIdentity(data.details.identity)
                                props.setGSTN(data.details.gstn === "-" ? "" : data.details.gstn)
                            }
                        }
                    })
                }
                props.setValue(newValue)
            }}
            onCreateOption={handleCreate}
            options={options}
            value={props.value}
            defaultValue={props.defaultValue}
            onInputChange={handleInputChange}
            styles={colourStyles}
            placeholder="Customer Name"
            classNamePrefix="name-select"
        />
    )
}

function Room(props){
    return (
        <div className={props.booked === false ? "room" : "room lock"}>
            {props.booked === false ? <div className="gray">
                <i className="fi fi-rr-add" onClick={() => {
                    props.setRoomNum(props.room_num)
                    props.setRoomMembers(props.capacity)
                    props.setRoomPpn(props.ppn)
                    props.openCheckinModal()
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
                if (occupiedRooms.length === 0){
                    roomData.forEach(room => room.booked = false)
                    setRooms(data.rooms[props.floor_num.toString()])
                    return
                }
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
                ? rooms.map(room => <Room room_num={room.room_num} ppn={room.ppn} capacity={room.capacity} type={room.type} floor_num={props.floor_num} booked={room.booked} name={room.name} openCheckinModal={props.openCheckinModal} setRoomNum={props.setRoomNum} setRoomMembers={props.setRoomMembers} setRoomPpn={props.setRoomPpn} />)
                : rooms.filter(room => room.type === props.filterType).map(room => <Room room_num={room.room_num} ppn={room.ppn} capacity={room.capacity} type={room.type} floor_num={props.floor_num} booked={room.booked} name={room.name} openCheckinModal={props.openCheckinModal} setRoomNum={props.setRoomNum} setRoomMembers={props.setRoomMembers} setRoomPpn={props.setRoomPpn} />)}
            </div>
        </div>) : ""
    )
}


function Checkin(){
    const [filterFloor, setFilterFloor] = useState("All")
    const [filterType, setFilterType] = useState("All")
    const [filterFrom, setFilterFrom] = useState(new Date().toISOString().substring(0, 10))
    const [filterTo, setFilterTo] = useState(new Date(new Date().getTime() + 86400000).toISOString().substring(0, 10))
    const [floors, setFloors] = useState([])
    const [roomTypes, setRoomTypes] = useState([])
    const [minTo, setMinTo] = useState(new Date().toISOString().substring(0, 10))

    const [open, setOpen] = useState(false)
    const [successOpen, setSuccessOpen] = useState(false)

    const [roomNum, setRoomNum] = useState("")
    const [roomMembers, setRoomMembers] = useState("")
    const [roomPpn, setRoomPpn] = useState("")

    const [successMessage, setSuccessMessage] = useState("")
    const [txnId, setTxnId] = useState("")

    function modalOpen(){
        setOpen(true)
    }

    function modalClose(){
        setOpen(false)
    }


    function successModalOpen(){
        setSuccessOpen(true)
    }

    function successModalClose(){
        setSuccessOpen(false)
    }

    function SuccessModalPopup(props){
        return (
            <Modal isOpen={successOpen} onRequestClose={successModalClose} contentLabel="Success Modal" shouldCloseOnOverlayClick={false} style={{
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
                    height: "auto",
                    width: "auto",
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
                <div className="success-text">
                    <section className="success-title">
                        <h1 className="success-message">{props.message}</h1>
                        <i className="fi fi-rr-cross-circle" onClick={() => {
                            successModalClose()
                            window.location.reload()
                        }}></i>
                    </section>
                    <section className="success-main">
                        <span className="success-txn-id-text">Transaction ID: </span>
                        <span className="success-txn-id orange" onClick={() => {
                            navigator.clipboard.writeText(props.txnId)
                            toast.success("Copied to clipboard", {
                                position: "top-right",
                                autoClose: 1500,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "light",
                            });
                        }} title="Copy Transaction ID">{props.txnId}</span>
                    </section>
                </div>
            </Modal>
        )
    }

    function CheckinModalPopup(){
        const [inRoomNum, setInRoomNum] = useState(roomNum)
        const [inPpn, setInPpn] = useState(roomPpn)
        const [advance, setAdvance] = useState()
        const [phoneNum, setPhoneNum] = useState("")
        const [members, setMembers] = useState(roomMembers)
        const [identity, setIdentity] = useState("")
        const [gstn, setGSTN] = useState("")
        const [inFrom, setInFrom] = useState(filterFrom)
        const [inTo, setInTo] = useState(filterTo)
        const [inMinTo, setInMinTo] = useState(minTo)
        const [foodPackages, setFoodPackages] = useState([])
        const [customerName, setCustomerName] = useState("")
        const [documents, setDocuments] = useState([])
        const [docsData, setDocsData] = useState({})
        const [filesReady, setFilesReady] = useState(false)
        const [test, setTest] = useState(false)
        const [breakfastPrice, setBreakfastPrice] = useState(0)
        const [lunchPrice, setLunchPrice] = useState(0)
        const [dinnerPrice, setDinnerPrice] = useState(0)
        const [roomTotal, setRoomTotal] = useState(0)

        const phoneInpRef = useRef()
        const identityInpRef = useRef()
        const gstnInpRef = useRef()
        // const phoneInpRef = useRef()

        useEffect(() => {
            fetch("http://127.0.0.1:8080/food_packages_prices", {method: "GET", credentials: "include"})
            .then(res => res.json())
            .then(data => {
                setBreakfastPrice(data.breakfast)
                setLunchPrice(data.lunch)
                setDinnerPrice(data.dinner)
            })
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
        
        function handleFiles(e){
            const _docs = documents
            Array.from(e.target.files).forEach(file => {
                _docs.push(file)
            })
            setDocuments(_docs)
            setTest(!test)
        }        
        function handleSubmit(){
            if ((inRoomNum === "" || inPpn === "" || inPpn === 0 || phoneNum === "" || members === 0 || members === "" || phoneNum.length !== 10 || phoneNum === "" || identity === "" || inFrom === "" || inTo === "") || (gstn !== "" && gstn.length !== 15)){
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
                setFilesReady(true)
                return
            }
            documents.forEach(doc => {
                const reader = new FileReader()
                reader.addEventListener("load", (e) => {
                    _docsData[doc.name] = e.target.result
                    count = count - 1
                    if (count === 0){
                        setDocsData(_docsData)
                        setFilesReady(true)
                    }
                })
                reader.readAsDataURL(doc)
            })
        }

        useEffect(() => {
            if (filesReady === false){
                return
            }

            const food = foodPackages.map(foodPackage => foodPackage.value).join("")

            const payload = {
                room_num: inRoomNum,
                from: new Date(inFrom).getTime()/1000,
                to: new Date(inTo).getTime()/1000,
                customer_data: {
                    name: customerName.value,
                    members: members,
                    phone_num: "+91" + phoneNum,
                    identity: identity,
                    ppn: inPpn,
                    food: food,
                    gstn: gstn,
                    advance: typeof(advance) === "number" ? advance : 0,
                    files: docsData
                }
            }
            fetch("http://127.0.0.1:8080/checkin", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
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
                setSuccessMessage(data.message)
                setTxnId(data.txn_id)
                modalClose()
                successModalOpen()
            })

            setFilesReady(false)
        }, [filesReady])

        useEffect(() => {
            var _roomTotal = 0;
            _roomTotal = _roomTotal + parseInt(inPpn)
            foodPackages.forEach(_package => {
                if (_package.value === "B"){
                    _roomTotal = _roomTotal + breakfastPrice
                } else if (_package.value === "L"){
                    _roomTotal = _roomTotal + lunchPrice
                } else if (_package.value === "D"){
                    _roomTotal = _roomTotal + dinnerPrice
                }
            })
            setRoomTotal(_roomTotal)
        }, [foodPackages, inPpn])
        return (
            <Modal isOpen={open} onRequestClose={modalClose} contentLabel="Checkin Modal" shouldCloseOnOverlayClick={false} style={{
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
                    height: "100vh",
                    width: "auto",
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
                <div className="checkin-modal-main">
                    <div className="checkin-modal-title">
                        <h1>Customer Details</h1>
                        <i className="fi fi-rr-cross-circle" onClick={modalClose}></i>
                    </div>
                    <div className="checkin-modal-inputs">
                        <div className="checkin-modal-input">
                            <label>Customer Name <span className="compulsory">*</span></label>
                            <CustomSelect setValue={setCustomerName} value={customerName} setPhoneNum={setPhoneNum} setIdentity={setIdentity} setGSTN={setGSTN} setDocsData={setDocsData} setDocuments={setDocuments} />
                        </div>
                        <div className="checkin-modal-input row">
                            <section className="input-wrap">
                                <label>Room Number <span className="compulsory">*</span></label>
                                <input type="number" min="0" value={inRoomNum} onChange={(e) => setInRoomNum(e.target.value)} id="roomNumInput" />
                            </section>
                            <section className="input-wrap">
                                <label>Members <span className="compulsory">*</span></label>
                                <input type="number" min="1" value={members} onChange={(e) => setMembers(e.target.value)} id="membersInput" />
                            </section>
                        </div>
                        <div className="checkin-modal-input">
                            <label>Phone Number <span className="compulsory">*</span></label>
                            <section className="phone-section">
                                <span className="num-prefix">+91</span>
                                <input type="number" min="0" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} id="numInput" />
                            </section>
                        </div>
                        <div className="checkin-modal-input">
                            <label>Identity <span className="compulsory">*</span></label>
                            <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} id="identityInput" placeholder='Aadhar / PAN Number' ref={identityInpRef} />
                        </div>
                        <div className="checkin-modal-input row">
                            <section className="input-wrap">
                                <label>From <span className="compulsory">*</span></label>
                                <input type="date" min={new Date().toISOString().substring(0, 10)} value={inFrom} onChange={(e) => {
                                    setInFrom(e.target.value)
                                    setInMinTo(e.target.value)
                                    if (new Date(setInMinTo) > new Date(e.target.value)){
                                        setInTo(setInMinTo)
                                    } else {
                                        setInTo(e.target.value)
                                    }
                                }} id="roomFromInput" />
                            </section>
                            <section className="input-wrap">
                                <label>To <span className="compulsory">*</span></label>
                                <input type="date" min={inMinTo} value={inTo} onChange={(e) => setInTo(e.target.value)} id="roomToInput" />
                            </section>
                        </div>
                        <div className="checkin-modal-input">
                            <label>GSTN</label>
                            <input type="text" value={gstn} onChange={(e) => setGSTN(e.target.value)} id="gstnInput" ref={gstnInpRef} />
                        </div>
                        <div className="checkin-modal-input">
                            <label>Food Package <span className="compulsory">*</span></label>
                            <MultiSelect options={[{label: "Breakfast", value: "B"}, {label: "Lunch", value: "L"}, {label: "Dinner", value: "D"}]} setFoodPackages={setFoodPackages} />
                        </div>
                        <div className="checkin-modal-input row">
                            <section className="input-wrap">
                                <label>PPN<span className="compulsory">*</span></label>
                                <div className="prices-inputs">
                                    <section className="money-input">
                                        <span className="package-name">Breakfast: </span>
                                        <span>₹</span>
                                        <input type="number" min="0" value={foodPackages.filter(_package => _package.value === "B").length > 0 ? breakfastPrice : 0} id="breakfastPriceInput" disabled />
                                    </section>
                                    <section className="money-input">
                                        <span className="package-name">Lunch: </span>
                                        <span>₹</span>
                                        <input type="number" min="0" value={foodPackages.filter(_package => _package.value === "L").length > 0 ? lunchPrice : 0} id="lunchPriceInput" disabled />
                                    </section>
                                    <section className="money-input">
                                        <span className="package-name">Dinner: </span>

                                        <span>₹</span>
                                        <input type="number" min="0" value={foodPackages.filter(_package => _package.value === "D").length > 0 ? dinnerPrice : 0} id="dinnerPriceInput" disabled />
                                    </section>
                                    <section className="money-input">
                                        <span className="package-name">Base: </span>

                                        <span>₹</span>
                                        <input type="number" min="0" value={inPpn} onChange={(e) => setInPpn(e.target.value)} id="roomPpnInput" />
                                    </section>
                                    <section className="money-input">
                                        <span className="package-name">Total: </span>

                                        <span>₹</span>
                                        <input type="number" min="0" value={roomTotal} id="roomTotalInput" disabled className="orange"/>
                                    </section>
                                </div>
                            </section>
                            <section className="input-wrap">
                                <label>Advance <span className="compulsory">*</span></label>
                                <section className="money-input">
                                    <span>₹</span>
                                    <input type="number" min="0" value={advance} onChange={(e) => setAdvance(e.target.value)} id="roomAdvInput" />
                                </section>
                            </section>
                        </div>
                        <div className="checkin-modal-input">
                            <button className="file-upload-btn" onClick={() => document.getElementById("file-upload-input").click()}>Add Documents</button>
                            <input type="file" multiple accept="application/pdf" id="file-upload-input" style={{display: "none"}} onChange={(e) => handleFiles(e)} />
                        </div>
                        <div className="checkin-modal-input">
                            {documents.map(file => <CustomFile file={file} />)}
                        </div>
                        <div className="checkin-modal-input">
                            <button id="submitBtn" onClick={handleSubmit}>Submit Details</button>
                        </div>
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
            <Sidebar active="checkin" />
            <div className="checkin-main">
                <div className="checkin-title">
                    <h1 className="orange">Check In</h1>
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
                    <section>
                        <label>From: </label>
                        <input type="date" value={filterFrom} onChange={(e) => {
                            setFilterFrom(e.target.value)
                            setMinTo(e.target.value)
                            if (new Date(minTo) > new Date(e.target.value)){
                                setFilterTo(minTo)
                            } else {
                                setFilterTo(e.target.value)
                            }
                        }} min={new Date().toISOString().substring(0, 10)} />
                    </section>
                    <section>
                        <label>To: </label>
                        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} min={minTo} />
                    </section>
                </div>
                <div className="floors-main">
                {filterFloor === "All"
                ? floors.map(floor => <Floor floor_num={floor} filterType={filterType} openCheckinModal={modalOpen} setRoomNum={setRoomNum} setRoomMembers={setRoomMembers} setRoomPpn={setRoomPpn} />)
                : floors.filter(floor => floor.toString() === filterFloor.toString()).map(floor => <Floor floor_num={floor} filterType={filterType} openCheckinModal={modalOpen} setRoomNum={setRoomNum} setRoomMembers={setRoomMembers} setRoomPpn={setRoomPpn} />)}
                </div>
            
            </div>
            <ToastContainer />
            <CheckinModalPopup />
            <SuccessModalPopup message={successMessage} txnId={txnId} />
        </div>
    )
}

export default Checkin;
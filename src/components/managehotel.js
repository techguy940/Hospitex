import './css/managehotel.css';
import {DetailsInput, RupeeInput} from './forminputs.js';
import {useState, useEffect} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useNavigate} from 'react-router-dom';
import Sidebar from './sidebar.js';



function ManageHotel(){
    const navigate = useNavigate();
    const [hotelName, setHotelName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [gstn, setGSTN] = useState("");
    const [phoneNum, setPhoneNum] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [state, setHotelState] = useState("");
    const [city, setCity] = useState("");
    const [bfPrice, setBfPrice] = useState(0);
    const [lunchPrice, setLunchPrice] = useState(0);
    const [dinnerPrice, setDinnerPrice] = useState(0);
    const [disabled, setDisabled] = useState(true);
    const [iconClassName, setIconClassName] = useState("fi fi-rr-pen-circle");

    useEffect(() => {
        fetch("http://127.0.0.1:8080/get_hotel_details", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === false) return
            const hotelDetails = data.hotel_details
            setHotelName(hotelDetails.hotel_name)
            setOwnerName(hotelDetails.owner)
            setGSTN(hotelDetails.gstn)
            setPhoneNum(hotelDetails.phone_num)
            setEmail(hotelDetails.email)
            setAddress(hotelDetails.address)
            setHotelState(hotelDetails.state)
            setCity(hotelDetails.city)
            setBfPrice(hotelDetails.bf_price)
            setLunchPrice(hotelDetails.lunch_price)
            setDinnerPrice(hotelDetails.dinner_price)
        })

    }, [])

    function toggleInputs(){
        if (disabled === true){
            setIconClassName("fi fi-br-cross-small")
        } else {
            setIconClassName("fi fi-rr-pen-circle")
        }
        setDisabled(!disabled);
    }

    function setHotelDetails(e){
        e.preventDefault();
        const hotelData = {
            hotel_name: hotelName,
            gstn: gstn,
            address: address,
            city: city,
            state: state,
            phone_num: phoneNum,
            email: email,
            bf_price: bfPrice,
            lunch_price: lunchPrice,
            dinner_price: dinnerPrice,
            owner: ownerName
        }
        fetch("http://127.0.0.1:8080/set_hotel_details", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(hotelData)})
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
                setTimeout(() => window.location.reload(), 2500);
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
            <Sidebar active="manage-hotel" />
            <div className="manage-hotel-parent">
                <section className="manage-hotel-title">
                    <h1>Manage your <span className="orange">hotel</span></h1>
                </section>
                <section>
                    <form className="manage-hotel-form" onSubmit={setHotelDetails}>
                        <section>
                            <DetailsInput className="hotel-input" id="hotel-name" inputType="text" labelText="Hotel Name" setFunc={setHotelName} value={hotelName} compulsory disabled={disabled} />
                            <i className={iconClassName} onClick={toggleInputs} id="toggleIcon"></i>
                        </section>
                        <section>
                            <DetailsInput className="hotel-input" id="owner-name" inputType="text" labelText="Owner Name" setFunc={setOwnerName} value={ownerName} compulsory disabled={disabled} />
                        </section>
                        <section>
                            <DetailsInput className="hotel-input" id="gstn" inputType="text" labelText="GSTN" setFunc={setGSTN} value={gstn} compulsory disabled={disabled} />
                        </section>
                        <section>
                            <DetailsInput className="hotel-input" id="phone-num" inputType="text" labelText="Phone Number" setFunc={setPhoneNum} value={phoneNum} compulsory disabled={disabled} />
                            <DetailsInput className="hotel-input" id="email" inputType="email" labelText="Email" setFunc={setEmail} value={email} compulsory disabled={disabled} />
                        </section>
                        <section>
                        <div className="hotel-input" id="address">
                            <label htmlFor="address-input">Address<span className="compulsory"> *</span></label>
                            <textarea type="text" id="address-input" onChange={e => setAddress(e.target.value)} value={address} disabled={disabled} />
                        </div>
                            {/* <DetailsInput className="hotel-input" id="address" inputType="text" labelText="Address" setFunc={setAddress} compulsory /> */}
                        </section>
                        <section>
                            <DetailsInput className="hotel-input" id="state" inputType="text" labelText="State" setFunc={setHotelState} value={state} compulsory disabled={disabled} />
                            <DetailsInput className="hotel-input" id="city" inputType="text" labelText="City" setFunc={setCity} value={city} compulsory disabled={disabled} />
                        </section>
                        <section>
                            <RupeeInput className="hotel-input" id="bf-price" inputType="number" labelText="Breakfast Price" setFunc={setBfPrice} value={bfPrice} disabled={disabled} />
                            <RupeeInput className="hotel-input" id="lunch-price" inputType="number" labelText="Lunch Price" setFunc={setLunchPrice} value={lunchPrice} disabled={disabled} />
                            <RupeeInput className="hotel-input" id="dinner-price" inputType="number" labelText="Dinner Price" setFunc={setDinnerPrice} value={dinnerPrice} disabled={disabled} />
                        </section>
                        <section>
                            <button type="submit" id="submitBtn">Submit details</button>
                            <button type="reset" id="resetBtn">Reset details</button>
                        </section>
                    </form>
                </section>
            </div>
            <ToastContainer />
        </div>
    )
}

export default ManageHotel
import './css/hoteldetails.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify';
import {DetailsInput, RupeeInput} from './forminputs.js';
import 'react-toastify/dist/ReactToastify.css';


// function DetailsInput(props){
//     return (
//         props.compulsory === true ?
//         (<div className={props.className} id={props.id}>
//             <label htmlFor={`${props.id}-input`}>{props.labelText}<span className="compulsory"> *</span></label>
//             <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)}/>
//         </div>) 
//         : (<div className={props.className} id={props.id}>
//             <label htmlFor={`${props.id}-input`}>{props.labelText}</label>
//             <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)}/>
//         </div>) 
//     )
// }

// function RupeeInput(props){
//     return (
//         props.compulsory === true ?
//         (<div className={props.className} id={props.id}>
//             <label htmlFor={`${props.id}-input`}>{props.labelText}<span className="compulsory"> *</span></label>
//             <div className="price-wrapper">
//                 <div className="symbol">₹</div>
//                 <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)}/>
//             </div>
//         </div>) 
//         : (<div className={props.className} id={props.id}>
//             <label htmlFor={`${props.id}-input`}>{props.labelText}</label>
//             <div className="price-wrapper">
//                 <div className="symbol">₹</div>
//                 <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)}/>
//             </div>
//         </div>) 
//     )
// }

function HotelDetails(){
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
            if (data.message === "Hotel details successfully fetched"){
                navigate("/")
                return
            }
        })
    }, [])

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

    function submitHotelDetails(e){
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
                setTimeout(() => navigate("/dashboard"), 2500);
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
        <div className="wrapper">
            <form className="hotel-main" onSubmit={submitHotelDetails}>
                <h1 id="hotel-heading">Setup your <span>hotel</span> details</h1>
                <section>
                    <DetailsInput className="hotel-input" id="hotel-name" inputType="text" labelText="Hotel Name" setFunc={setHotelName} compulsory/>
                </section>
                <section>
                <DetailsInput className="hotel-input" id="owner-name" inputType="text" labelText="Owner Name" setFunc={setOwnerName} compulsory />
                </section>
                <section>
                    <DetailsInput className="hotel-input" id="gstn" inputType="text" labelText="GSTN" setFunc={setGSTN}compulsory />
                </section>
                <section>
                    <DetailsInput className="hotel-input" id="phone-num" inputType="text" labelText="Phone Number" setFunc={setPhoneNum} compulsory />
                    <DetailsInput className="hotel-input" id="email" inputType="email" labelText="Email" setFunc={setEmail} compulsory />
                </section>
                <section>
                <div className="hotel-input" id="address">
                    <label htmlFor="address-input">Address<span className="compulsory"> *</span></label>
                    <textarea type="text" id="address-input" onChange={e => setAddress(e.target.value)}/>
                </div>
                    {/* <DetailsInput className="hotel-input" id="address" inputType="text" labelText="Address" setFunc={setAddress} compulsory /> */}
                </section>
                <section>
                    <DetailsInput className="hotel-input" id="state" inputType="text" labelText="State" setFunc={setHotelState} compulsory />
                    <DetailsInput className="hotel-input" id="city" inputType="text" labelText="City" setFunc={setCity}compulsory />
                </section>
                <section>
                    <RupeeInput className="hotel-input" id="bf-price" inputType="number" labelText="Breakfast Price" setFunc={setBfPrice} />
                    <RupeeInput className="hotel-input" id="lunch-price" inputType="number" labelText="Lunch Price" setFunc={setLunchPrice}/>
                    <RupeeInput className="hotel-input" id="dinner-price" inputType="number" labelText="Dinner Price" setFunc={setDinnerPrice}/>
                </section>
                <section>
                    <button type="submit" id="submitBtn">Submit details</button>
                    <button type="reset" id="resetBtn">Reset details</button>
                </section>

            </form>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                />
                {/* Same as */}
            <ToastContainer />
        </div>
    )
}

export default HotelDetails
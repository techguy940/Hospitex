import "./css/sidebar.css";
import checkin from './images/checkin.png';
import checkout from './images/checkout.png';
import room from './images/room.png';
import food from './images/food.png';
import staff from './images/staff.png';
import payment from './images/payment.png';
import hotel from './images/hotel.png';
import logout from './images/logout.png';
import stats from './images/stats.png';
import search from './images/search.png';
import {toast, ToastContainer} from 'react-toastify';
import {useNavigate} from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";


function MenuItem(props){
    return (
        <div className={props.active === true ? "menuItem active" : "menuItem"} onClick={props.onClick}>
            <img src={props.src} alt={props.alt}></img>
            <span className="menuName">{props.text}</span>
        </div>
    )
}

function Sidebar(props){
    const navigate = useNavigate();
    const [hotelName, setHotelName] = useState()
    const [activePart, setActivePart] = useState(props.active)
    const [once, setOnce] = useState(false)

    useEffect(() => {
        fetch("http://127.0.0.1:8080/get_hotel_details", {method: "GET", credentials: "include"})
        .then(res => res.json())
        .then(data => {
            if (data.status === true){
                setHotelName(data.hotel_details.hotel_name)
            }
        })
    }, [once])

    useEffect(() => {
        navigate("/dashboard/" + activePart)
    }, [activePart])

    function logout_func(e){
        window.sessionStorage.removeItem("auth");
        fetch("http://127.0.0.1:8080/logout", {method: "POST", credentials: "include"})
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
                setTimeout(() => navigate("/"), 2500);
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
        <div>
            <div className="sidebar-main">
                <section className="hotelName">
                    <h1>{hotelName}</h1>
                </section>
                <section className="menuItems">
                    <MenuItem src={stats} alt="Statistics" text="Statistics" onClick={() => setActivePart("statistics")} active={activePart === "statistics" ? true : false} />
                    <MenuItem src={checkin} alt="Check in" text="Check in" onClick={() => setActivePart("checkin")} active={activePart === "checkin" ? true : false}/>
                    <MenuItem src={checkout} alt="Check out" text="Check out" onClick={() => setActivePart("checkout")} active={activePart === "checkout" ? true : false}/>
                    <MenuItem src={room} alt="Manage Rooms" text="Manage Rooms" onClick={() => setActivePart("manage-rooms")} active={activePart === "manage-rooms" ? true : false}/>
                    <MenuItem src={food} alt="Manage Food" text="Manage Food" onClick={() => setActivePart("manage-food")} active={activePart === "manage-food" ? true : false}/>
                    <MenuItem src={staff} alt="Manage Staff" text="Manage Staff" onClick={() => setActivePart("manage-staff")} active={activePart === "manage-staff" ? true : false}/>
                    <MenuItem src={payment} alt="Staff Payments" text="Staff Payments" onClick={() => setActivePart("staff-payments")} active={activePart === "staff-payments" ? true : false}/>
                    <MenuItem src={search} alt="Customer Records" text="Customer Records" onClick={() => setActivePart("customer-records")} active={activePart === "customer-records" ? true : false}/>
                    <MenuItem src={hotel} alt="Manage Hotel" text="Manage Hotel" onClick={() => setActivePart("manage-hotel")} active={activePart === "manage-hotel" ? true : false}/>
                </section>
                <section className="menuItems">
                    <MenuItem src={logout} alt="Logout" text="Logout" onClick={logout_func}/>
                </section>

            </div>
            <ToastContainer />
        </div>
    )
}

export default Sidebar;
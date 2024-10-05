import { useEffect, useState } from 'react';
import './css/login.css'
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    useEffect(() => {
        const auth = window.sessionStorage.getItem("auth");
        if (auth === 'true') {
            fetch("http://127.0.0.1:8080/verify", {method: "POST", credentials: "include"})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
                    navigate("/dashboard")
                    return
                }
            })
        }


    }, [])

    function handlePasswordClick(){
        if (passwordVisible === true){
            setPasswordVisible(false);
            document.getElementById("password").type = "text";
            document.getElementById("passwordIcon").innerHTML = '<i class="fi fi-rs-eye"></i>'

        } else if (passwordVisible === false) {
            setPasswordVisible(true);
            document.getElementById("password").type = "password";
            document.getElementById("passwordIcon").innerHTML = '<i class="fi fi-rs-crossed-eye"></i>'

        }

    }

    function login(e){
        e.preventDefault();
        fetch("http://127.0.0.1:8080/login", {method: "POST", credentials: "include", headers: {"content-type": "application/json"}, body: JSON.stringify({"username": username, "password": password})})
        .then((res) => res.json())
        .then((data) => {
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
                window.sessionStorage.setItem("auth", true);
                setTimeout(() => navigate("/dashboard"), 2500);
            } else if (data.status === false) {
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
                window.sessionStorage.setItem("auth", false);
            }
        })
    }
    return (
        <div className="login-parent">
            <form className="login-div" onSubmit={login}>
            <h1>Login</h1>
            <input id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
            <div id="passwordIcon" onClick={handlePasswordClick}><i className="fi fi-rs-crossed-eye"></i></div>
            <input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
            <button type="submit" onClick={login} id="submitBtn">Login</button>
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
            </form>
        </div>
    
    );
}

export default LoginPage;
import './css/suggestinput.css';
import {useState, useEffect} from 'react';

function getUniqueCustomers(query, setSuggestions){
    fetch("http://127.0.0.1:8080/unique_customers", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: query})})
    .then(res => res.json())
    .then(data => {
        setSuggestions(data.names)
    })
}

function Suggestion(props){
    return (
        <div className="suggestion">
            {props.suggestion}
        </div>
    )
}

function SuggestInput(props){
    const [suggestions, setSuggestions] = useState([])
    // useEffect(() => {
    //     console.log(suggestions)
    // }, [suggestions])
    return (
        <div>
            <div className="suggest-input">
                <section className="suggest-inputs">
                    <input type={props.type} value={props.value} onChange={(e) => {
                        props.setValue(e.target.value)
                        getUniqueCustomers(e.target.value, setSuggestions)
                        // setSuggestions(getUniqueCustomers(e.target.value))
                        // console.log(suggestions)
                    }} />
                    <i className="fi fi-br-cross-small" onClick={() => props.setValue("")}></i>
                </section>
            </div>
            <section className="suggestions">
                {suggestions.map(suggestion => <Suggestion suggestion={suggestion} />)}
            </section>
        </div>
    )
}

export default SuggestInput;
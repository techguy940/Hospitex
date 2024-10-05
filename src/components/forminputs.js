import './css/forminputs.css';

function DetailsInput(props){
    return (
        props.compulsory === true ?
        (<div className={props.className} id={props.id}>
            <label htmlFor={`${props.id}-input`}>{props.labelText}<span className="compulsory"> *</span></label>
            <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)} value={props.value} disabled={props.disabled}/>
        </div>) 
        : (<div className={props.className} id={props.id}>
            <label htmlFor={`${props.id}-input`}>{props.labelText}</label>
            <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)} value={props.value} disabled={props.disabled}/>
        </div>) 
    )
}

function RupeeInput(props){
    return (
        props.compulsory === true ?
        (<div className={props.className} id={props.id}>
            <label htmlFor={`${props.id}-input`}>{props.labelText}<span className="compulsory"> *</span></label>
            <div className="price-wrapper">
                <div className="symbol">₹</div>
                <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)} value={props.value} disabled={props.disabled}/>
            </div>
        </div>) 
        : (<div className={props.className} id={props.id}>
            <label htmlFor={`${props.id}-input`}>{props.labelText}</label>
            <div className="price-wrapper">
                <div className="symbol">₹</div>
                <input type={props.inputType} id={`${props.id}-input`} onChange={e => props.setFunc(e.target.value)} value={props.value} disabled={props.disabled}/>
            </div>
        </div>) 
    )
}

export { DetailsInput, RupeeInput };

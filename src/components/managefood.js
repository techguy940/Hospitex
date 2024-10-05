import './css/managefood.css';
import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import Select from 'react-select';
import {toast, ToastContainer} from 'react-toastify';
import {DetailsInput, RupeeInput} from './forminputs.js';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './sidebar.js';



Modal.setAppElement('#root');



// function FoodItem(props){
//     return (
//         <div className="item">
//             <span className="item-title">{props.name}</span>
//             <div className="item-utils">
//                 <span className="item-price">{"₹ " + props.price.toString()}</span>
//                 <i className="fi fi-rr-pen-circle"></i>
//                 <i className="fi fi-rs-add"></i>
//             </div>
//         </div>
//     )
// }

function Table(props){
    var subTotal = 0
    const CGST_PER = 0.09
    const SGST_PER = 0.09
    return (
        <table className="modal-table">
            <thead>
                <tr>
                    <th>Particular</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {
                    props.cart.filter(i => i.quantity !==0).map(item => {
                        subTotal = subTotal + parseInt(item.quantity) * parseInt(item.price)
                        return (
                            <tr>
                                <td>{item.name}</td>
                                <td className="right">{item.price.toString()}</td>
                                <td className="right">{item.quantity.toString()}</td>
                                <td className="total right">{"₹ " + (parseInt(item.quantity) * parseInt(item.price)).toString()}</td>
                            </tr>
                        )
                    })
                }
                <tr>
                    <td colSpan="3" className="bold center">{`CGST (${CGST_PER*100}%)`}</td>
                    <td className="total right">{"₹ " + parseFloat(subTotal*CGST_PER).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colSpan="3" className="bold center">{`SGST (${SGST_PER*100}%)`}</td>
                    <td className="total right">{"₹ " + parseFloat(subTotal*SGST_PER).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colSpan="3" className="bold center">Round Off</td>
                    <td className="total right">{"₹ " + parseFloat(Math.round((subTotal + subTotal*CGST_PER + subTotal*SGST_PER)) - (subTotal + subTotal*CGST_PER + subTotal*SGST_PER)).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colSpan="3" className="bold center">Total Invoice Value</td>
                    <td className="total center final">{"₹ " + Math.round((subTotal + subTotal*CGST_PER + subTotal*SGST_PER))}</td>
                </tr>
            </tbody>
        </table>
    )
}

function randstr(prefix) { 
    return Math.random().toString(36).replace('0.',prefix || '')
}

function SubCategoryItem(props){
    return (
        <div className="subcategory-item-input" id={props.id}>
            <input type="text" className="subcategory-item-name-input" placeholder="Item Name"></input>
            <input type="number" className="subcategory-item-price-input" placeholder="Price"></input>
            <i className="fi fi-rs-trash" onClick={() => document.getElementById(props.id).remove()}></i>
        </div>
    )
}

function ManageFood(){
    const [subCategories, setSubCategories] = useState([])


    const [cart, setCart] = useState([])

    const [modalIsOpen, setIsOpen] = useState(false);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
    const [deleteSubCategoryModalOpen, setDeleteSubCategoryModalOpen] = useState(false);
    const [addSubCategoryModalOpen, setAddSubCategoryModalOpen] = useState(false);

    const [editItemOld, setEditItemOld] = useState("");
    const [editItemPriceOld, setEditItemPriceOld] = useState(0);

    const [editItem, setEditItem] = useState("");
    const [editItemPrice, setEditItemPrice] = useState(0);

    const [subCategory, setSubCategory] = useState("");
    const [deleteItemName, setDeleteItemName] = useState("");
    const [deleteItemPrice, setDeleteItemPrice] = useState(0);
    const [deleteItemSubCategory, setDeleteItemSubCategory] = useState("");

    const [deleteSubCategory, setDeleteSubCategory] = useState("");


    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    function openItemModal(){
        setItemModalOpen(true)
    }

    function closeItemModal(){
        setItemModalOpen(false)
    }

    function openAddItemModal(){
        setAddItemModalOpen(true)
    }

    function closeAddItemModal(){
        setAddItemModalOpen(false)
    }

    function openDeleteItemModal(){
        setDeleteItemModalOpen(true)
    }

    function closeDeleteItemModal(){
        setDeleteItemModalOpen(false)
    }

    function openDeleteSubCategoryModal(){
        setDeleteSubCategoryModalOpen(true)
    }

    function closeDeleteSubCategoryModal(){
        setDeleteSubCategoryModalOpen(false)
    }

    function openAddSubCategoryModal(){
        setAddSubCategoryModalOpen(true)
    }

    function closeAddSubCategoryModal(){
        setAddSubCategoryModalOpen(false)
    }

    function addSubcategory(subCategoryName){
        if (subCategoryName === ""){
            toast.error("Subcategory name is missing", {
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
        const _items = Array.from(document.getElementsByClassName("subcategory-item-input"))
        if (_items.length === 0){
            toast.error("Atleast one item is required", {
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
        const items = []
        _items.forEach(item => {
            const name = item.children[0].value
            const price = item.children[1].value
            items.push({name: name, price: price})
        })

        fetch("http://127.0.0.1:8080/add_subcategory", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({sub_category: subCategoryName, items: items})})
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
                setTimeout(() => closeAddSubCategoryModal(), 2500)
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

    function ModalPopup(){
        const [options, setOptions] = useState([])
        const [txnId, setTxnId] = useState("")
        const colourStyles = {
            control: styles => ({ ...styles, backgroundColor: 'white', width: "86vw", borderColor: "var(--primary-color)"}),
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
        useEffect(() => {
            fetch("http://127.0.0.1:8080/short_details", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({from: (Date.now()/1000)})})
            .then(res => res.json())
            .then(data => {
                if (data.status === false) return
                const options = [];
                data.data.forEach(room => {
                    options.push({value: room.txn_id, label: room.name + " (" + room.room_num + ") (" + room.from + " - " + room.to + ")"})
                    setOptions(options)
                })        
            })
        }, [])

        function handleChange(option){
            setTxnId(option.value)
        }

        function addOrder(){
            if (txnId === ""){
                toast.error("Select Room Number", {
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

            fetch("http://127.0.0.1:8080/add_order", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({txn_id: txnId, items: cart.filter(i => i.quantity !== 0)})})
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
                }
                setTimeout(() => closeModal(), 2500)
                setTimeout(() => window.location.reload(), 3000)
            })
        }
        return (
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Add Order Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "90vh",
                    width: "90%",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)'
                }
            }}>
                <div className="modal-main">
                    <div className="close-modal">
                        <i className="fi fi-rr-cross-circle" id="close-btn" onClick={closeModal}></i>
                    </div>
                    <div className="modal-parent">
                        <section>
                            <label>Room Number</label>
                            <Select options={options} label="Enter Room Number" styles={colourStyles} onChange={handleChange} />
                        </section>
                        <section>
                            <Table cart={cart}/>
                        </section>
                        <section className="add-order">
                            <button id="add-order-btn" onClick={addOrder}>Add Order</button>
                        </section>
                    </div>
                </div>
            </Modal>
        )
    }

    function ItemModalPopup(props){
        const [editItem_, setEditItem_] = useState(props.editItem)
        const [editItemPrice_, setEditItemPrice_] = useState(props.editItemPrice)
        function _editItem(){
            if (editItem_ === "" || editItemPrice_ === "" || editItemPrice_ === 0) {
                toast.error("Invalid Inputs", {
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

            if (editItem_ === editItemOld && editItemPrice_ === editItemPriceOld){
                closeItemModal()
                return
            }

            fetch("http://127.0.0.1:8080/edit_food", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({old_name: editItemOld, old_price: editItemPriceOld, new_name: editItem_, new_price: editItemPrice_, type: "food_item"})})
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
                    setTimeout(() => closeItemModal(), 2500)
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
                    setTimeout(() => closeItemModal(), 2500)
                }
            })
        }
        return (
            <Modal isOpen={itemModalOpen} onRequestClose={closeItemModal} contentLabel="Edit Item Modal" style={{
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
                    height: "41vh",
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
                <div className="edit-item-modal">
                    <section className="edit-item-title">
                        <h1>Edit Food Item Details</h1>
                        <i className="fi fi-rr-cross-circle" onClick={closeItemModal}></i>
                    </section>
                    <section className="edit-item-details">
                        <DetailsInput className="food-item-title" id="item-name" labelText="Item Name" inputType="text" value={editItem_} setFunc={setEditItem_} compulsory/>
                        <RupeeInput className="food-item-price" id="item-price" labelText="Price" inputType="number" value={editItemPrice_} setFunc={setEditItemPrice_} compulsory/>
                    </section>
                    <section className="edit-item">
                            <button id="edit-item-btn" onClick={_editItem}>Edit Details</button>
                        </section>
                </div>
            </Modal>
        )

    }

    function AddItemModalPopup(props){
        const [itemName, setItemName] = useState("")
        const [itemSubCategory, setItemSubCategory] = useState(props.subCategory)
        const [itemPrice, setItemPrice] = useState(0)
        function addItem(){
            if (itemName === "" || itemSubCategory === "" || itemPrice === 0 || itemPrice === ""){
                toast.error("Invalid Inputs", {
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

            fetch("http://127.0.0.1:8080/update_food", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: itemName, price: itemPrice, sub_category: itemSubCategory})})
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
                    setTimeout(() => closeAddItemModal(), 2500)
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
                    setTimeout(() => closeAddItemModal(), 2500)
                }
            })
        }
        return (
            <Modal isOpen={addItemModalOpen} onRequestClose={closeAddItemModal} contentLabel="Add Item Modal" style={{
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
                    height: "50vh",
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
                <div className="add-item-modal">
                    <section className="add-item-title">
                        <h1>Add Food Item</h1>
                        <i className="fi fi-rr-cross-circle" onClick={closeAddItemModal}></i>
                    </section>
                    <section className="add-item-details">
                        <DetailsInput className="food-item-title" id="item-name" labelText="Item Name" inputType="text" value={itemName} setFunc={setItemName} compulsory/>
                        <DetailsInput className="food-item-subcategory" id="item-subcategory" labelText="Subcategory" inputType="text" value={itemSubCategory} setFunc={setItemSubCategory} compulsory/>
                        <RupeeInput className="food-item-price" id="item-price" labelText="Price" inputType="number" value={itemPrice} setFunc={setItemPrice} compulsory/>
                    </section>
                    <section className="add-item">
                            <button id="add-item-btn" onClick={addItem}>Add Item</button>
                        </section>
                </div>
            </Modal>
        )

    }

    function DeleteItemModalPopup(){
        return (
            <Modal isOpen={deleteItemModalOpen} onRequestClose={closeDeleteItemModal} contentLabel="Delete Item Modal" style={{
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
                    height: "20.8vh",
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
                <div className="delete-item-modal">
                    <section className="delete-item-title">
                        <h1>Delete Food Item</h1>
                        <i className="fi fi-rr-cross-circle" onClick={closeDeleteItemModal}></i>
                    </section>
                    <section className="delete-item-text">
                        <p>Do you want to <span className="red bold">delete</span> this item?</p>
                    </section>
                    <section className="delete-item-btns">
                        <button id="go-back" onClick={closeDeleteItemModal}>Go Back</button>
                        <button id="delete-item-btn" onClick={() => deleteItem(deleteItemName, deleteItemPrice, deleteItemSubCategory)}>Delete Item</button>
                    </section>
                </div>
            </Modal>
        )
    }

    function AddSubCategoryModalPopup(){
        const [subCategoryName, setSubCategoryName] = useState("")
        const [subCategoryItems, setSubCategoryItems] = useState([randstr("input_")])
        const [test, setTest] = useState(true)
        return (
            <Modal isOpen={addSubCategoryModalOpen} onRequestClose={closeAddSubCategoryModal} contentLabel="Add Category Modal" style={{
                overlay: {
                    position: "fixed",
                    width: "100%",
                    height: "100vh",
                    padding: "0",
                    color: 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    scrollbarWidth: "0 !important"
                    
                },
                content: {
                    display: "flex",
                    backgroundColor: "white",
                    height: "50vh",
                    width: "40%",
                    padding: "0",
                    position: "fixed",
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    scrollbarWidth: "0 !important",
                }
            }}>
                <div className="add-subcategory-modal">
                    <section className="add-subcategory-title">
                        <h1>Add Subcategory</h1>
                        <i className="fi fi-rr-cross-circle" onClick={closeAddSubCategoryModal}></i>
                    </section>
                    <section className="add-subcategory-details">
                        <DetailsInput className="subcategory-title" id="subcategory-name" labelText="Subcategory Name" inputType="text" value={subCategoryName} setFunc={setSubCategoryName} compulsory/>
                        <div className="subcategory-items">
                            <p id="subcategory-add-items-title">Add Items</p>
                            <div className="subcategory-items-utils">
                                <span className="subcategory-item-add-name">Name</span>
                                <span className="subcategory-item-add-price orange">Price (₹)</span>
                                <i className="fi fi-rr-add" onClick={() => {
                                    subCategoryItems.push(randstr("input_"))
                                    setSubCategoryItems(subCategoryItems)
                                    setTest(!test)
                                }}></i>
                            </div>
                            {subCategoryItems.map(i => <SubCategoryItem id={i} />)}
                        </div>
                    </section>
                    <section className="add-subcategory">
                        <button id="add-subcategory-btn" onClick={() => addSubcategory(subCategoryName)}>Add Subcategory</button>
                    </section>
                </div>
            </Modal>
        )
    }

    function DeleteSubCategoryModalPopup(){
        return (
            <Modal isOpen={deleteSubCategoryModalOpen} onRequestClose={closeDeleteSubCategoryModal} contentLabel="Delete Subcategory Modal" style={{
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
                    height: "20.8vh",
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
                <div className="delete-subcategory-modal">
                    <section className="delete-subcategory-title">
                        <h1>Delete Sub Category</h1>
                        <i className="fi fi-rr-cross-circle" onClick={closeDeleteSubCategoryModal}></i>
                    </section>
                    <section className="delete-subcategory-text">
                        <p>Do you want to <span className="red bold">delete</span> this subcategory?</p>
                    </section>
                    <section className="delete-subcategory-btns">
                        <button id="go-back" onClick={closeDeleteSubCategoryModal}>Go Back</button>
                        <button id="delete-subcategory-btn" onClick={() => _deleteSubCategory(deleteSubCategory)}>Delete Subcategory</button>
                    </section>
                </div>
            </Modal>
        )
    }


    function editSubCategory(e, oldName){
        console.log(e)
        if (e.target.className === "fi fi-rr-pen-circle"){
            e.target.className = "fi fi-rs-check-circle"
            e.target.parentElement.children[0].contentEditable = "true";
        } else if (e.target.className === "fi fi-rs-check-circle") {
            e.target.parentElement.children[0].contentEditable = "false";
            e.target.className = "fi fi-rr-pen-circle"
            if (e.target.parentElement.children[0].innerText === oldName){
                e.target.className = "fi fi-rr-pen-circle"
                return
            }
            fetch("http://127.0.0.1:8080/edit_food", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({old: oldName, new: e.target.parentElement.children[0].innerText, type: "sub_category"})})
            .then(res => res.json())
            .then(data => {
                if (data.status === true){
                    window.location.reload()
                } else if (data.status === false){
                    toast.error(data.message, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                }
            })
            e.target.className = "fi fi-rr-pen-circle"
        }

    }

    function deleteItem(name, price, subCategory){
        fetch("http://127.0.0.1:8080/update_food", {method: "DELETE", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: name, price: price, sub_category: subCategory})})
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
                setTimeout(() => closeDeleteItemModal(), 2500)
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
                setTimeout(() => closeDeleteItemModal(), 2500)
            }
        })
    }

    function _deleteSubCategory(){
        fetch("http://127.0.0.1:8080/delete_subcategory", {method: "DELETE", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify({sub_category: deleteSubCategory})})
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
                setTimeout(() => closeDeleteSubCategoryModal(), 2500)
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
                setTimeout(() => closeDeleteSubCategoryModal(), 2500)

            }
        })
    }


    function FoodItem(props){
        const [icon, setIcon] = useState("fi fi-rr-pen-circle")
        const [itemCount, setItemCount] = useState(0)
        return (
            <div className="item">
                <span className="item-title">{props.name}</span>
                <div className="item-utils">
                    <span className="item-price">{"₹ " + props.price.toString()}</span>
                    <i className={icon} onClick={() => {
                        if (icon === "fi fi-rs-minus-circle"){
                            cart.forEach(item => {
                                if (item.name === props.name){
                                    item.quantity = item.quantity - 1
                                }
                            })
                            setItemCount(itemCount - 1)
                            if ((itemCount-1) === 0){
                                setIcon("fi fi-rr-pen-circle")
                            }

                            const cartLength = cart.filter(i => i.quantity > 0).length
                            if (cartLength > 0){
                                document.getElementById("cart-btn").style.display = "block";
                                document.getElementById("count").style.display = "block";
                                document.getElementById("count").innerText = cartLength.toString();
                            } else if (cartLength === 0) {
                                document.getElementById("cart-btn").style.display = "none";
                                document.getElementById("count").style.display = "none";
                            }
                        } else if (icon === "fi fi-rr-pen-circle"){
                            setEditItemOld(props.name)
                            setEditItemPriceOld(props.price)
                            setEditItem(props.name)
                            setEditItemPrice(props.price)
                            openItemModal()
                        }
                    }}></i>
                    <span id="item-count" style={{display: itemCount > 0 ? "block": "none"}}>{itemCount}</span>
                    <i className="fi fi-rs-add" onClick={() => {
                        const exists = cart.filter(i => i.name === props.name)
                        if (exists.length > 0){
                            cart.forEach(item => {
                                if (item.name === props.name){
                                    item.quantity = item.quantity + 1
                                }
                            })
                        } else {
                            cart.push({name: props.name, quantity: 1, price: props.price})
                        }
                        setItemCount(itemCount + 1)
                        if (icon !== "fi fi-rs-minus-circle"){
                            setIcon("fi fi-rs-minus-circle")
                        }
                        setCart(cart)
                        const cartLength = cart.filter(i => i.quantity > 0).length
                        if (cartLength > 0){
                            document.getElementById("cart-btn").style.display = "block";
                            document.getElementById("count").style.display = "block";
                            document.getElementById("count").innerText = cartLength.toString();
                        } else if (cartLength === 0) {
                            document.getElementById("cart-btn").style.display = "none";
                            document.getElementById("count").style.display = "none";
                        }
                    }}></i>
                    <i className="fi fi-rs-trash" id="deleteBtn" onClick={() => {
                        setDeleteItemName(props.name)
                        setDeleteItemPrice(props.price)
                        setDeleteItemSubCategory(props.subCategory)
                        openDeleteItemModal()
                    }}></i>
                </div>
            </div>
        )
    }

    useEffect(() => {
        function getFoodItems(){
            fetch("http://127.0.0.1:8080/food_items", {method: "GET", credentials: "include"})
            .then(res => res.json())
            .then(data => {
                if (data.status === false) return
                const subCategories = []
                data.order.forEach(key => {
                    subCategories.push(
                        <div key={key} className="food-item">
                            <div className="food-title-utils">
                                <h1 className="food-category-title">{key}</h1>
                                <i className="fi fi-rr-pen-circle" onClick={(e) => editSubCategory(e, key)}></i>
                                <i className="fi fi-rs-add" onClick={() => {
                                    setSubCategory(key)
                                    openAddItemModal()
                                    }}></i>
                                <i className="fi fi-rs-trash" id="deleteSubCategory" onClick={() => {
                                    setDeleteSubCategory(key)
                                    openDeleteSubCategoryModal()
                                }}></i>
                            </div>
                            <div className="items-list">
                                {
                                    data.food_items[key].map(i => <FoodItem name={i.name} price={i.price} subCategory={key} />)
                                }
                            </div>
                        </div>
                    )
                })
                setSubCategories(subCategories);
            })
        }

        getFoodItems()
    }, [])

    // function handleLunchClick(e){
    //     if ((e.target.parentElement.className !== "lunch-div" && e.target.parentElement.className !== "lunch-title") || e.target.classList[0] === "lunch-items"){
    //         return
    //     }
    //     if (lunchIcon === "fi fi-rr-angle-small-down"){
    //         setLunchIcon("fi fi-rr-angle-small-up")
    //     } else {
    //         setLunchIcon("fi fi-rr-angle-small-down")
    //     }

    //     if (lunchActive === ""){
    //         setLunchActive(" active")
    //     } else {
    //         setLunchActive("")
    //     }


    //     if (lunchIcon === "fi fi-rr-angle-small-up"){
    //         return
    //     }

    //     fetch("http://127.0.0.1:8080/food_items", {method: "GET", credentials: "include"})
    //     .then(res => res.json())
    //     .then(data => {
    //         const foodItems = data.food_items.lunch
    //         const seen = []
    //         const subCategories = []
    //         foodItems.forEach(item => {
    //             if ((seen.includes(item.sub_category)) === false){
    //                 subCategories.push(
    //                     <div key={item.sub_category} className="food-item">
    //                         <div className="food-title-utils">
    //                             <h1 className="food-category-title">{item.sub_category}</h1>
    //                             <i className="fi fi-rr-pen-circle" onClick={(e) => editSubCategory(e, item.sub_category)}></i>
    //                             <i className="fi fi-rs-add" onClick={() => {
    //                                 setSubCategory(item.sub_category)
    //                                 setCategory("Lunch")
    //                                 openAddItemModal()
    //                                 }}></i>
    //                         </div>
    //                         <div className="items-list">
    //                             {
    //                                 foodItems.filter(i => i.sub_category === item.sub_category).map(i => <FoodItem name={i.name} price={i.price} />)
    //                             }
    //                         </div>
    //                     </div>
    //                 )
    //                 seen.push(item.sub_category)
    //             }
    //         })
    //         setLunchSubCategories(subCategories);
    //     })
    // }

    // function handleDinnerClick(e){

    //     if ((e.target.parentElement.className !== "dinner-div" && e.target.parentElement.className !== "dinner-title") || e.target.classList[0] === "dinner-items"){
    //         return
    //     }
    //     if (dinnerIcon === "fi fi-rr-angle-small-down"){
    //         setDinnerIcon("fi fi-rr-angle-small-up")
    //     } else {
    //         setDinnerIcon("fi fi-rr-angle-small-down")
    //     }

    //     if (dinnerActive === ""){
    //         setDinnerActive(" active")
    //     } else {
    //         setDinnerActive("")
    //     }


    //     if (dinnerIcon === "fi fi-rr-angle-small-up"){
    //         return
    //     }

    //     fetch("http://127.0.0.1:8080/food_items", {method: "GET", credentials: "include"})
    //     .then(res => res.json())
    //     .then(data => {
    //         const foodItems = data.food_items.dinner
    //         const seen = []
    //         const subCategories = []
    //         foodItems.forEach(item => {
    //             if ((seen.includes(item.sub_category)) === false){
    //                 subCategories.push(
    //                     <div key={item.sub_category} className="food-item">
    //                         <div className="food-title-utils">
    //                             <h1 className="food-category-title">{item.sub_category}</h1>
    //                             <i className="fi fi-rr-pen-circle" onClick={(e) => editSubCategory(e, item.sub_category)}></i>
    //                             <i className="fi fi-rs-add" onClick={() => {
    //                                 setSubCategory(item.sub_category)
    //                                 setCategory("Dinner")
    //                                 openAddItemModal()
    //                                 }}></i>
    //                         </div>
    //                         <div className="items-list">
    //                             {
    //                                 foodItems.filter(i => i.sub_category === item.sub_category).map(i => <FoodItem name={i.name} price={i.price} />)
    //                             }
    //                         </div>
    //                     </div>
    //                 )
    //                 seen.push(item.sub_category)
    //             }
    //         })
    //         setDinnerSubCategories(subCategories);
    //     })
    // }
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
        <div className="page-main">
            <Sidebar active="manage-food" />
            <div className="manage-food-main">
                <div className="manage-food-title">
                    <h1>Manage <span className="orange">food</span></h1>
                </div>
                <div className="add-category">
                    <div id="addCategoryBtn" onClick={openAddSubCategoryModal}><i class="fi fi-rr-add"></i>Add Subcategory</div>  
                </div>
                <div className="food-div">
                    <div className="food-items">
                        {subCategories}
                    </div>
                </div>
                {/* <div className="lunch-div" onClick={handleLunchClick}>
                    <div className="lunch-title">
                        <h1>Lunch</h1>
                        <i className={lunchIcon}></i>
                    </div>
                    <div className={"lunch-items"+lunchActive}>
                        {lunchSubCategories}
                    </div>
                </div>
                <div className="dinner-div" onClick={handleDinnerClick}>
                    <div className="dinner-title">
                        <h1>Dinner</h1>
                        <i className={dinnerIcon}></i>
                    </div>
                    <div className={"dinner-items"+dinnerActive}>
                        {dinnerSubCategories}
                    </div>
                </div> */}
            </div>
            <div className="proceed-cart">
                <button id="cart-btn" onClick={openModal}><i className="fi fi-rr-arrow-small-right"></i><span id="count"></span></button>
            </div>
            <ModalPopup />
            <ItemModalPopup editItem={editItem} setEditItem={setEditItem} editItemPrice={editItemPrice} setEditItemPrice={setEditItemPrice} />
            <AddItemModalPopup subCategory={subCategory} />
            <DeleteItemModalPopup />
            <DeleteSubCategoryModalPopup />
            <AddSubCategoryModalPopup />
            <ToastContainer />
        </div>
    )
}

export default ManageFood;
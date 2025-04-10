from flask import Flask, request, jsonify, make_response, send_file, send_from_directory
from hashlib import md5
import aiosqlite
import jwt
import time
from datetime import datetime, timedelta
import json
import bill
import pandas as pd
import math
from flask_cors import CORS
import base64
import os

app = Flask(__name__)
HSN = 996332
CGST_PER = 0.09
SGST_PER = 0.09

cors = CORS(app, supports_credentials=True)


def get_expiry(days=15):
    return int(time.time()) + (days*86400)

def generate_txn_id():
    return datetime.fromtimestamp(time.time()).strftime("TXN%Y%m%d%I%M%S")

async def _add_adv_to_db(adv, txn_id):
    async with aiosqlite.connect("sales.db") as db:
        day, month, year = datetime.now().strftime("%d/%m/%Y").split("/")
        await db.execute("INSERT INTO Advance VALUES (?, ?, ?, ?, ?)", (day, month, year, adv, txn_id))
        await db.commit()
        return jsonify({"status": True, "message": "Advance added successfully"}), 200

async def check_staff_id(_id):
    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT name FROM Staff WHERE id = (?)", (_id, ))
        record = await cursor.fetchone()
        if record == None:
            return True
        return False


async def verify_token(token):
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT username FROM Credentials WHERE auth_token = (?)", (token, ))
        username = await cursor.fetchone()
        with open("secret.txt") as f:
            secret = f.read().strip()
        if username == None:
            return {"status": False, "message": "Invalid Username or Token"}
        if (jwt.decode(token, secret, algorithms=["HS256"]))['exp'] < int(time.time()):
            return {"status": False, "message": "Token Expired"}
        return {"status": True}

async def _get_hotel_details():
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT * FROM Hotel")
        hotel_data = await cursor.fetchone()
        if hotel_data == None:
            return {"status": True, "message": "Hotel details not found"}
        return {"status": True, "message": "Hotel details successfully fetched", "hotel_details": {"hotel_name": hotel_data[0], "gstn": hotel_data[1], "address": hotel_data[2], "city": hotel_data[3], "state": hotel_data[4], "phone_num": hotel_data[5], "email": hotel_data[6], "bf_price": hotel_data[7], "lunch_price": hotel_data[8], "dinner_price": hotel_data[9], "owner": hotel_data[10]}}

@app.errorhandler(404)
def page_not_found(e):
    return "<h1>404 - Page Not Found</h1>", 404

# @app.route("/echo", methods=["POST"])
# async def echo():
#     headers = request.headers
#     print(headers)
#     print(request.json)
#     return jsonify({"echo": True})
#     # resp = make_response({"echo": True})
#     # resp.headers['Access-Control-Allow-Credentials'] = True
#     # return resp


@app.route("/login", methods=["POST"])
async def login():

    data = request.json
    if data.get("username") == None or data.get("password") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT password FROM Credentials WHERE username = (?)", (data['username'], ))
        password = await cursor.fetchone()
        if password == None:
            return jsonify({"status": False, "message": "Invalid Username or Password"}), 401
        if (md5(data['password'].encode()).hexdigest()) != password[0]:
            return jsonify({"status": False, "message": "Invalid Username or Password"}), 401
        with open("secret.txt") as f:
            secret = f.read().strip()
        # cursor = await db.execute("SELECT hotel FROM Credentials WHERE username = (?)", (data['username'], ))
        # hotel = (await cursor.fetchone())[0]
        user_data = {"username": data['username'], "exp": get_expiry()}
        auth_token = jwt.encode(user_data, secret, algorithm="HS256")
        refresh_token = jwt.encode({"auth_token": auth_token, "exp": get_expiry(days=30)}, secret, algorithm="HS256")
        await db.execute("UPDATE Credentials SET auth_token = (?) WHERE username = (?)", (auth_token, data['username']))
        await db.commit()
        resp = make_response({"status": True, "message": "Login successful"})
        resp.set_cookie("auth_token", auth_token, httponly=True, samesite='None', secure=True)
        return resp
        # return jsonify({"status": True, "auth_token": auth_token, "refresh_token": refresh_token}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/logout", methods=["POST"])
async def logout():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    token = headers['cookie'].split("=")[1]

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("UPDATE Credentials SET auth_token = '' WHERE auth_token = (?)", (token, ))
        await db.commit()
        return jsonify({"status": True, "message": "Logout done successfully"})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    




@app.route("/refresh_token", methods=["POST"])
async def refresh_token():
    data = request.json

    data = request.json
    if data.get("refresh_token") == None or data.get("auth_token") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 401
    with open("secret.txt") as f:
        secret = f.read().strip()
    refresh_token = data['refresh_token']
    try:
        token_data = jwt.decode(refresh_token, secret, algorithms=["HS256"])
    except:
        return jsonify({"status": False, "message": "Invalid Token"}), 401
    if (time.time()) > token_data['exp']:
        return jsonify({"status": False, "message": "Refresh Token Expired"}), 401
    if token_data['auth_token'] == data['auth_token']:
        user_data = jwt.decode(token_data['auth_token'], secret, algorithms=["HS256"])
        user_data['exp'] = get_expiry()
        auth_token = jwt.encode(user_data, secret, algorithm="HS256")
        refresh_token = jwt.encode({"auth_token": auth_token, "exp": get_expiry(days=30)}, secret, algorithm="HS256")
        async with aiosqlite.connect("hotel.db") as db:
            await db.execute("UPDATE Credentials SET auth_token = (?) WHERE username = (?)", (auth_token, user_data['username']))
            await db.commit()
        return jsonify({"status": True, "auth_token": auth_token, "refresh_token": refresh_token}), 200
    return jsonify({"status": False, "message": "Invalid Token"}), 401

@app.route("/verify", methods=["POST"])
async def verify():
    if request.headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 401
    msg = await verify_token(request.headers['cookie'].split("=")[1])
    if not msg['status']:
        return jsonify(msg), 401
    return jsonify(msg), 200

@app.route("/checkin", methods=["POST"])
async def checkin():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    # Check for room data
    if data.get("room_num") == None or data.get("from") == None or data.get("to") == None:
        return jsonify({"status": False, "message": "Incomplete Information Passed"}), 400

    # Check for customer data
    customer_data = data['customer_data']
    if customer_data.get("name") == None or customer_data.get("members") == None or customer_data.get("phone_num") == None or customer_data.get("identity") == None or customer_data.get("files") == None:
        return jsonify({"status": False, "message": "Customer Data Missing"}), 400

    # Check if room exists
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT ppn FROM Rooms WHERE room_num = (?)", (data['room_num'], ))
        room_ppn = await cursor.fetchone()
        if room_ppn == None:
            return jsonify({"status": False, "message": "Invalid Room Number"}), 400

    if customer_data.get("ppn"):
        ppn = int(customer_data['ppn'])
    else:
        ppn = int(room_ppn[0])

    if customer_data.get("food"):
        food = customer_data['food']
    else:
        food = ""

    # Get Breakfast, Lunch, Dinner prices
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT bf_price, lunch_price, dinner_price FROM Hotel")
        prices = await cursor.fetchone()
        bf_price, lunch_price, dinner_price = prices

    for i in food:
        if i == "B":
            ppn += bf_price
        elif i == "L":
            ppn += lunch_price
        elif i == "D":
            ppn += dinner_price

    # Checking if room is available for given time
    room_available_l = []
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute('SELECT "from", "to" FROM Users WHERE room_num = (?)', (data['room_num'], ))
        room_data = await cursor.fetchall()
        for i in room_data:
            if i[0] < int(data['from']) < i[1]:
                room_available_l.append(False)
            elif int(data['from']) < i[0] < int(data['to']):
                room_available_l.append(False)
        if len(room_available_l) > 0:
            return jsonify({"status": False, "message": "Room not available for given dates"}), 200

        del room_available_l

    docs = []
    docs_names = []
    for i in customer_data['files']:
        docs_names.append(i)
        docs.append(customer_data['files'][i].replace("data:application/pdf;base64,", ""))

    docs = json.dumps(docs)
    docs_names = json.dumps(docs_names)


    # Room Booking
    async with aiosqlite.connect("hotel.db") as db:
        txn_id = generate_txn_id()
        if customer_data.get("advance") != None:
            if int(customer_data.get("advance")) > 0:
                await _add_adv_to_db(int(customer_data['advance']), txn_id)
        cursor = await db.execute('INSERT INTO Users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (customer_data['name'], data['room_num'], customer_data['members'], customer_data['phone_num'], customer_data['identity'], food, ppn, data['from'], data['to'], txn_id, "[]", (customer_data.get("gstn") or "-"), (int(customer_data.get("advance")) or 0), docs, docs_names))
        await db.commit()
        async with aiosqlite.connect("record.db") as db:
            cursor = await db.execute('INSERT INTO Users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (customer_data['name'], data['room_num'], customer_data['members'], customer_data['phone_num'], customer_data['identity'], food, ppn, data['from'], data['to'], txn_id, "[]", (customer_data.get("gstn") or "-"), (int(customer_data.get("advance")) or 0), docs, docs_names))
            await db.commit()

        return jsonify({"status": True, "message": "Room booked successfully", "txn_id": txn_id}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/details", methods=["GET"])
async def details():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("txn_id") == None:
        return jsonify({"status": False, "message": "No Transaction ID passed"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT * FROM Users WHERE txn_id = (?)", (data['txn_id'],))
        user_data = await cursor.fetchone()
        if user_data == None:
            return jsonify({"status": True, "message": "No Data Found"}), 200
        return jsonify({"status": True, "details": {"name": user_data[0], "room_num": user_data[1], "members": user_data[2], "phone_num": user_data[3], "identity": user_data[4], "food": user_data[5], "ppn": user_data[6], "from": user_data[7], "to": user_data[8], "orders": json.loads(user_data[10]), "gstn": user_data[11], "advance": user_data[12]}})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/short_details", methods=["POST", "GET"])
async def short_details():
    data =  request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("from") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute('SELECT name, room_num, txn_id, "from", "to" FROM Users WHERE "from" <= (?)', (data['from'], ))
        _user_data = await cursor.fetchall()
        user_data = []
        for i in _user_data:
            user_data.append({"name": i[0], "room_num": i[1], "from": datetime.fromtimestamp(i[3]).strftime("%d/%m/%Y"), "to": datetime.fromtimestamp(i[4]).strftime("%d/%m/%Y"), "txn_id": i[2]})
        return jsonify({"status": True, "data": user_data})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/details", methods=["POST"])
async def post_details():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("txn_id") == None or data.get("room_num") == None or data.get("from") == None or data.get("to") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    customer_data = data['customer_data']

    if customer_data.get("name") == None or customer_data.get("members") == None or customer_data.get("phone_num") == None or customer_data.get("identity") == None or customer_data.get("ppn") == None or customer_data.get("gstn") == None or customer_data.get("advance") == None or customer_data.get("files") == None:
        return jsonify({"status": False, "message": "Customer Data Missing"}), 400

    ppn = int(customer_data['ppn'])
    food = customer_data.get("food") or ""


    docs = []
    docs_names = []
    for i in customer_data['files']:
        docs_names.append(i)
        docs.append(customer_data['files'][i].replace("data:application/pdf;base64,", ""))
    docs = json.dumps(docs)
    docs_names = json.dumps(docs_names)

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT bf_price, lunch_price, dinner_price FROM Hotel")
        prices = await cursor.fetchone()
        bf_price, lunch_price, dinner_price = prices

    for i in food:
        if i == "B":
            ppn += bf_price
        elif i == "L":
            ppn += lunch_price
        elif i == "D":
            ppn += dinner_price
    async with aiosqlite.connect("hotel.db") as db:
        await db.execute('UPDATE Users SET name = (?), room_num = (?), members = (?), phone_num = (?), identity = (?), food = (?), ppn = (?), "from" = (?), "to" = (?), gstn = (?), advance = (?), documents = (?), documents_names = (?) WHERE txn_id = (?)', (customer_data['name'], data['room_num'], customer_data['members'], customer_data['phone_num'], customer_data['identity'], food, ppn, data['from'], data['to'], customer_data['gstn'], customer_data['advance'], docs, docs_names, data['txn_id']))
        await db.commit()
        async with aiosqlite.connect("record.db") as db:
            await db.execute('UPDATE Users SET name = (?), room_num = (?), members = (?), phone_num = (?), identity = (?), food = (?), ppn = (?), "from" = (?), "to" = (?), gstn = (?), advance = (?), documents = (?), documents_names = (?) WHERE txn_id = (?)', (customer_data['name'], data['room_num'], customer_data['members'], customer_data['phone_num'], customer_data['identity'], food, ppn, data['from'], data['to'], customer_data['gstn'], customer_data['advance'], docs, docs_names, data['txn_id']))
            await db.commit()

        return jsonify({"status": True, "message": "Details updated successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500



@app.route("/checkout", methods=["POST"])
async def checkout():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("txn_id") == None:
        return jsonify({"status": False, "message": "No Transaction ID passed"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT name FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        name = await cursor.fetchone()
        if name == None:
            return jsonify({"status": False, "message": "Invalid Transaction ID"}), 200
        # generate_bill(invoice_no, hotel_name, owner, city, address, phone_num, hotel_gstn, email, customer, cust_gstn, cust_pan, date, items)
        """
        {"hotel_name": hotel_data[0], "gstn": hotel_data[1], "address": hotel_data[2], "city": hotel_data[3], "state": hotel_data[4], "phone_num": hotel_data[5], "email": hotel_data[6], "bf_price": hotel_data[7], "lunch_price": hotel_data[8], "dinner_price": hotel_data[9], "owner": hotel_data[10]}
        """
        # invoice_no = data['txn_id']

        # hotel_data = (await _get_hotel_details())['hotel_details']
        # hotel_name = hotel_data['hotel_name']
        # owner = hotel_data['owner']
        # city = hotel_data['city']
        # address = hotel_data['address']
        # phone_num = hotel_data['phone_num']
        # hotel_gstn = hotel_data['gstn']
        # email = hotel_data['email']


        cursor = await db.execute('SELECT "from", "to", ppn FROM Users WHERE txn_id = (?)', (data['txn_id'], ))
        customer_data = await cursor.fetchone()
        # customer = customer_data[0]
        # cust_gstn = customer_data[1]
        # cust_pan = customer_data[2]
        date = int(time.time())
        # items = json.loads(customer_data[4].replace("'", '"'))

        ppn = int(customer_data[2])
        # room_num = customer_data[6]
        _to = int(customer_data[1])
        _from = int(customer_data[0])

        days = (datetime.fromtimestamp(_to) - datetime.fromtimestamp(_from)).days
        if days == 0:
            room_total = ppn
        else:
            room_total = ppn * days

        # cursor = await db.execute("SELECT type FROM Rooms WHERE room_num = (?)", (room_num, ))
        # room_type = (await cursor.fetchone())[0]

        # items.insert(0, ["", room_type + " Room", HSN, ppn, days, room_total])


        # await bill.generate_bill(invoice_no, hotel_name, owner, city, address, phone_num, hotel_gstn, email, customer, cust_gstn, cust_pan, date, items)

        async with aiosqlite.connect("sales.db") as _db:
            day, month, year = datetime.fromtimestamp(date).strftime("%d/%m/%Y").split("/")
            await _db.execute("DELETE FROM Advance WHERE txn_id = (?)", (data['txn_id'], ))
            await _db.execute("INSERT INTO Sales VALUES (?, ?, ?, ?, ?)", (day, month, year, room_total, data['txn_id']))
            await _db.execute("INSERT INTO CGST VALUES (?, ?, ?, ?, ?)", (day, month, year, room_total*CGST_PER, data['txn_id']))
            await _db.execute("INSERT INTO SGST VALUES (?, ?, ?, ?, ?)", (day, month, year, room_total*SGST_PER, data['txn_id']))
            await _db.commit()

        cursor = await db.execute("DELETE FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        await db.commit()
        return jsonify({"status": True, "message": "Checkout successfully done"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/get_hotel_details")
async def hotel_details():
    # data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    #data['token'] = headers['cookie'].split("=")[1]

    return jsonify(await _get_hotel_details()), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/food_packages_prices")
async def get_food_packages_prices():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT bf_price, lunch_price, dinner_price FROM Hotel")
        prices = await cursor.fetchone()
        return jsonify({"status": True, "breakfast": prices[0], "lunch": prices[1], "dinner": prices[2]}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    

@app.route("/set_hotel_details", methods=["POST"])
async def set_hotel_details():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("hotel_name") == None or data.get("gstn") == None or data.get("address") == None or data.get("city") == None or data.get("state") == None or data.get("phone_num") == None or data.get("email") == None or data.get("bf_price") == None or data.get("lunch_price") == None or data.get("dinner_price") == None or data.get("owner") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("UPDATE Hotel SET name = (?), gstn = (?), address = (?), city = (?), state = (?), phone_num = (?), email = (?), bf_price = (?), lunch_price = (?), dinner_price = (?), owner_name = (?)", (data['hotel_name'], data['gstn'], data['address'], data['city'], data['state'], data['phone_num'], data['email'], int(data['bf_price']), int(data['lunch_price']), int(data['dinner_price']), data['owner']))
        await db.commit()
        return jsonify({"status": True, "message": "Data set successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/food_items")
async def get_food_items():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT * FROM Food")
        _food_items = await cursor.fetchall()
        food_items = {}
        for item in _food_items:
            if item[2] not in food_items:
                food_items[item[2]] = []
            food_items[item[2]].append({"name": item[0], "price": item[1]})
        items_order_list = [k for k, v in sorted(food_items.items(), key=lambda x: len(x[1]))]
        return jsonify({"status": True, "food_items": food_items, "order": items_order_list})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/update_food", methods=["POST"])
async def add_food():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("name") == None or data.get("price") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("INSERT INTO Food VALUES (?, ?, ?)", (data['name'], int(data['price']), data['sub_category']))
        await db.commit()
        return jsonify({"status": True, "message": "Item added successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/edit_food", methods=["POST"])
async def edit_food():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("type") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if data['type'] not in ("sub_category", "food_item"):
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400


    if data['type'] == "sub_category":
        if data.get("old") == None or data.get("new") == None:
            return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if data['type'] == "food_item":
        if data.get("old_name") == None or data.get("old_price") == None or data.get("new_name") == None or data.get("new_price") == None:
            return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        if data['type'] == "sub_category":
            await db.execute("UPDATE Food SET sub_category = (?) WHERE sub_category = (?)", (data['new'], data['old']))
            await db.commit()
        elif data['type'] == "food_item":
            await db.execute("UPDATE Food SET name = (?), price = (?) WHERE name = (?) AND price = (?)", (data['new_name'], data['new_price'], data['old_name'], data['old_price']))
            await db.commit()

        return jsonify({"status": True, "message": "Update successful"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500



@app.route("/update_food", methods=["DELETE"])
async def remove_food():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("name") == None or data.get("price") == None or data.get("sub_category") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT name FROM Food WHERE name = (?) AND price = (?) AND sub_category = (?)", (data['name'], int(data['price']), data['sub_category']))
        food_data = await cursor.fetchone()
        if food_data == None:
            return jsonify({"status": False, "message": "Invalid Item"}), 400

        await db.execute("DELETE FROM Food WHERE name = (?) AND price = (?) AND sub_category = (?)", (data['name'], int(data['price']), data['sub_category']))
        await db.commit()
        return jsonify({"status": True, "message": "Item removed successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/delete_subcategory", methods=["DELETE"])
async def delete_subcategory():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("sub_category") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("DELETE FROM Food WHERE sub_category = (?)", (data['sub_category'], ))
        await db.commit()
        return jsonify({"status": True, "message": "Subcategory removed successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/add_subcategory", methods=["POST"])
async def add_subcategory():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("sub_category") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if data.get("items") == None:
        return jsonify({"status": False, "message": "Atleast one item is required"}), 400


    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT sub_category FROM Food WHERE sub_category = (?)", (data['sub_category'], ))
        exists = await cursor.fetchone()
        if exists != None:
            return jsonify({"status": False, "message": "Subcategory with the name already exists"}), 400
        for item in data['items']:
            await db.execute("INSERT INTO Food VALUES (?, ?, ?)", (item['name'], item['price'], data['sub_category']))
        await db.commit()
        return jsonify({"status": True, "message": "Subcategory added successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    


@app.route("/add_order", methods=["POST"])
async def add_order():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("items") == None or data.get("txn_id") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if len(data['items']) == 0:
        return jsonify({"status": True, "message": "Hah you tried"}), 200

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT orders FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        items = json.loads((await cursor.fetchone())[0].replace("'", '"'))
        for item in items:
            for i in data['items']:
                cursor = await db.execute("SELECT price FROM Food WHERE name = (?)", (i['name'], ))
                price = await cursor.fetchone()
                if price == None:
                    continue
                if item[1] == i["name"] and datetime.now().strftime("%d/%m/%Y") == item[0]:
                    if i.get("done") == None or i.get("done") == False:
                        item[4] += i["quantity"]
                        item[5] = item[3] * item[4]
                        i['done'] = True
        for i in data['items']:
            if i.get("done") == True:
                continue
            if i['quantity'] == 0:
                continue
            cursor = await db.execute("SELECT price FROM Food WHERE name = (?)", (i['name'], ))
            price = await cursor.fetchone()
            if price == None:
                continue
            # print(price)
            items.append([datetime.now().strftime("%d/%m/%Y"), i['name'], HSN, int(price[0]), i['quantity'], i['quantity']*int(price[0])])
            # seen = []
            # for item in items:
            #     if item[1] == i["name"] and datetime.now().strftime("%d/%m/%Y") == item[0]:
            #         if i.get("done") == None or i.get("done") == False:
            #             item[4] += i["quantity"]
            #             item[5] = item[3] * item[4]
            #             i['done'] = True
            #     else:
            #         if i.get("done") == None or i.get("done") == False:
            #             items.append([datetime.now().strftime("%d/%m/%Y"), i['name'], HSN, int(price[0]), i['quantity'], i['quantity']*int(price[0])])
            #             i['done'] = True
            # for item in data['items']:
            #     if item.get("done") == None or item.get("done") == False:

            #         items.append([datetime.now().strftime("%d/%m/%Y"), i['name'], HSN, int(price[0]), i['quantity'], i['quantity']*int(price[0])])


            # items.append([datetime.now().strftime("%d/%m/%Y"), i['name'], HSN, int(price[0]), i['quantity'], i['quantity']*int(price[0])])
        await db.execute("UPDATE Users SET orders = (?) WHERE txn_id = (?)", (str(items), data['txn_id']))
        await db.commit()
        async with aiosqlite.connect("record.db") as db:
            await db.execute("UPDATE Users SET orders = (?) WHERE txn_id = (?)", (str(items), data['txn_id']))
            await db.commit()
        return jsonify({"status": True, "message": "Order added successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/advance", methods=["POST"])
async def advance():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("advance") == None or data.get("txn_id") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400


    async with aiosqlite.connect("hotel.db") as db:
        cursor = await cursor.execute("SELECT advance FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        _advance = await cursor.fetchone()
        if _advance == None:
            return jsonify({"status": False, "message": "Invalid txn_id"}), 400
        _advance[0] = _advance[0] + int(data['advance'])
        await cursor.execute("UPDATE Users SET advance = (?) WHERE txn_id = (?)", (_advance[0], data['txn_id']))
        await db.commit()
        async with aiosqlite.connect("record.db") as db:
            await cursor.execute("UPDATE Users SET advance = (?) WHERE txn_id = (?)", (_advance[0], data['txn_id']))
            await db.commit()

    await _add_adv_to_db(int(data['advance']), data['txn_id'])
    return jsonify({"status": True, "message": "Advance added successfully"}), 200


@app.route("/staff")
async def get_all_staff():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT name, id, spm, sick_leaves, casual_leaves, special_leaves, designation, dob, blood_group, doa, dor, address, educational_qualifications, phone_num, image, pan, aadhar FROM Staff")
        staff_data = await cursor.fetchall()
        staff_data = list(map(lambda x: {"name": x[0], "id": x[1], "spm": x[2], "sick_leaves": x[3], "casual_leaves": x[4], "special_leaves": x[5], "designation": x[6], "dob": x[7], "blood_group": x[8], "doa": x[9], "dor": x[10], "address": x[11], "educational_qualifications": x[12], "phone_num": x[13], "image": x[14], "pan": x[15], "aadhar": x[16]}, staff_data))
        return jsonify({"status": True, "staff_data": staff_data})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_brief")
async def get_all_staff_brief():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT name, id, spm, dor, image, designation FROM Staff")
        staff_data = await cursor.fetchall()
        staff_data = list(map(lambda x: {"name": x[0], "id": x[1], "spm": x[2], "dor": x[3], "image": x[4], "designation": x[5]}, staff_data))
        return jsonify({"status": True, "staff_data": staff_data})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_documents", methods=["POST"])
async def get_staff_documents():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("id") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT documents, documents_names FROM Staff WHERE id = (?)", (data['id'], ))
        _docs = await cursor.fetchone()
        docs = {}
        for doc, name in zip(json.loads(_docs[0]), json.loads(_docs[1])):
            docs[name] = doc
        return jsonify({"status": True, "documents": docs})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    






@app.route("/add_staff", methods=["POST"])
async def add_staff():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("name") == None or data.get("id") == None or data.get("spm") == None or data.get("designation") == None or data.get("dob") == None or data.get("blood_group") == None or data.get("doa") == None or data.get("address") == None or data.get("educational_qualifications") == None or data.get("phone_num") == None or data.get("image") == None or data.get("files") == None or data.get("pan") == None or data.get("aadhar") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if not id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    docs = []
    docs_names = []
    for i in data['files']:
        docs_names.append(i)
        docs.append(data['files'][i])

    docs = json.dumps(docs)
    docs_names = json.dumps(docs_names)

    async with aiosqlite.connect("staff.db") as db:
        await db.execute("INSERT INTO Staff VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (data['name'], data['id'], data['spm'], 0, 0, 0, data['designation'], data['dob'], data['blood_group'], data['doa'], "-", data['address'], data['educational_qualifications'], data['phone_num'], data['image'], docs, docs_names, data['pan'], data['aadhar']))
        await db.commit()
        return jsonify({"status": True, "message": "Staff added successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/remove_staff", methods=["POST"])
async def remove_staff():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("id") == None or data.get("time") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    async with aiosqlite.connect("staff.db") as db:
        await db.execute("UPDATE Staff SET dor = (?) WHERE id = (?)", (data['time'], data['id']))
        await db.commit()
        return jsonify({"status": True, "message": "Staff removed successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_details", methods=["POST"])
async def staff_details():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("name") == None or data.get("id") == None or data.get("spm") == None or data.get("designation") == None or data.get("dob") == None or data.get("blood_group") == None or data.get("address") == None or data.get("educational_qualifications") == None or data.get("phone_num") == None or data.get("image") == None or data.get("files") == None or data.get("pan") == None or data.get("aadhar") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    docs = []
    docs_names = []
    for i in data['files']:
        docs_names.append(i)
        docs.append(data['files'][i])

    docs = json.dumps(docs)
    docs_names = json.dumps(docs_names)

    async with aiosqlite.connect("staff.db") as db:
        await db.execute("UPDATE Staff SET name = (?), spm = (?), designation = (?), dob = (?), blood_group = (?), address = (?), educational_qualifications = (?), phone_num = (?), image = (?), documents = (?), documents_names = (?), pan = (?), aadhar = (?) WHERE id = (?)", (data['name'], data['spm'], data['designation'], data['dob'], data['blood_group'], data['address'], data['educational_qualifications'], data['phone_num'], data['image'], docs, docs_names, data['pan'], data['aadhar'], data['id']))
        await db.commit()
        return jsonify({"status": True, "message": "Details updated successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_attendance", methods=["POST"])
async def staff_attendance():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("id") == None or data.get("status") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    if data['status'] == "absent" and data.get("leave_type") == None:
        return jsonify({"status": False, "message": "Leave type not specified"}), 400

    if data['status'] == "absent" and (data['leave_type'] not in ("sick", "casual", "special")):
        return jsonify({"status": False, "message": "Invalid Leave Type"}), 400

    cur_date = datetime.now().strftime("%d/%m/%Y")

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT status FROM StaffLog WHERE id = (?) AND log_date = (?)", (data['id'], cur_date))
        if (await cursor.fetchone()) != None:
            return jsonify({"status": False, "message": "Attendance already logged for given ID"}), 200
        await db.execute("INSERT INTO StaffLog VALUES (?, ?, ?, ?, ?)", (data['id'], int(time.time()), cur_date, data['status'], (data.get("leave_type") or "-")))
        if data['status'] == "absent":
            if data['leave_type'] == "sick":
                await db.execute("UPDATE Staff SET sick_leaves = sick_leaves + 1 WHERE id = (?)", (data['id'], ))
                await db.commit()
            elif data['leave_type'] == "casual":
                await db.execute("UPDATE Staff SET casual_leaves = casual_leaves + 1 WHERE id = (?)", (data['id'], ))
                await db.commit()

            elif data['leave_type'] == "special":
                await db.execute("UPDATE Staff SET special_leaves = special_leaves + 1 WHERE id = (?)", (data['id'], ))
                await db.commit()

        await db.commit()
        return jsonify({"status": True, "message": "Attendance logged successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/staff_salary_data", methods=["POST"])
async def get_staff_salary_data():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("id") == None or data.get("month") == None or data.get("year") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    data['month'] = int(data['month'])
    data['year'] = int(data['year'])

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND status = (?) AND month = (?) AND year = (?)", (data['id'], "advance", data['month'], data['year']))
        _advances = await cursor.fetchall()
        advance = 0
        for i in _advances:
            advance += float(i[0])
        cursor = await db.execute("SELECT spm FROM Staff WHERE id = (?)", (data['id'], ))
        spm = float((await cursor.fetchone())[0])
        return jsonify({"status": True, "advance": advance, "spm": spm, "to_pay": spm - advance}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/staff_salary", methods=["POST"])
async def staff_salary():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("id") == None or data.get("status") == None or data.get("month") == None or data.get("year") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    if (data['status'] == "advance" or data['status'] == "bonus") and data.get("amount") == None:
        return jsonify({"status": False, "message": "Amount not specified"}), 400

    data['month'] = int(data['month'])
    data['year'] = int(data['year'])

    async with aiosqlite.connect("staff.db") as db:
        if data['status'] == "salary":
            cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND month = (?) AND year = (?)", (data['id'], data['month'], data['year']))
            exist = await cursor.fetchone()
            if exist != None:
                return jsonify({"status": False, "message": "Salary for given month is already paid"}), 200
            cursor = await db.execute("SELECT spm FROM Staff WHERE id = (?)", (data['id'], ))
            salary = float((await cursor.fetchone())[0])
            cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND status = (?) AND month = (?) AND year = (?)", (data['id'], "advance", data['month'], data['year']))
            _advances = 0
            advances = await cursor.fetchall()
            for i in advances:
                _advances += float(i[0])
            to_pay = salary - _advances
            await db.execute("INSERT INTO StaffSalary VALUES (?, ?, ?, ?, ?, ?)", (data['id'], data['status'], to_pay, data['month'], data['year'], int(time.time())))

        elif (data['status'] == "advance" or data['status'] == "bonus"):
            cursor = await db.execute("INSERT INTO StaffSalary VALUES (?, ?, ?, ?, ?, ?)", (data['id'], data['status'], data['amount'], data['month'], data['year'], int(time.time())))

        await db.commit()
        return jsonify({"status": True, "message": "Payment paid successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/generate_staff_report", methods=["POST"])
async def generate_staff_report():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("id") == None or data.get("from") == None or data.get("to") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT status, amount, month, year, time FROM StaffSalary WHERE id = (?) AND time >= (?) AND time <= (?)", (data['id'], data['from'], data['to']))
        payments = await cursor.fetchall()
        payments_data = []
        for i in payments:
            payments_data.append([i[4], i[0].title(), datetime(1, i[2], 1).strftime("%B"), i[3], i[1]])

        cursor = await db.execute("SELECT name FROM Staff WHERE id = (?)", (data['id'], ))
        name = (await cursor.fetchone())[0]

        async with aiosqlite.connect("hotel.db") as db2:
            cursor = await db2.execute("SELECT name FROM Hotel")
            hotel_name = (await cursor.fetchone())[0]

            await bill.generate_staff_report(hotel_name, data['id'], name, payments_data)

            with open(f"report{data['id']}.pdf", "rb") as pdf_file:
                encoded_string = base64.b64encode(pdf_file.read())

            os.remove(f"report{data['id']}.pdf")
            os.remove(f"report{data['id']}.xlsx")

            return jsonify({"status": True, "file": f"data:application/pdf;base64,{encoded_string.decode()}"})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/generate_payslip", methods=["POST"])
async def generate_payslip():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("id") == None or data.get("month") == None or data.get("year") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    data['month'] = int(data['month'])
    data['year'] = int(data['year'])

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND month = (?) AND year = (?)", (data['id'], data['month'], data['year']))
        status = await cursor.fetchone()
        cursor = await db.execute("SELECT spm FROM Staff WHERE id = (?)", (data['id'], ))
        base_salary = float((await cursor.fetchone())[0]) if status != None else 0
        cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND status = (?) AND month = (?) AND year = (?)", (data['id'], "advance", data['month'], data['year']))
        _advances = 0
        advances = await cursor.fetchall()
        for i in advances:
            _advances += float(i[0])
        cursor = await db.execute("SELECT amount FROM StaffSalary WHERE id = (?) AND status = (?) AND month = (?) AND year = (?)", (data['id'], "bonus", data['month'], data['year']))
        _bonuses = 0
        bonuses = await cursor.fetchall()
        for i in bonuses:
            _bonuses += float(i[0])

        if base_salary == 0 and _advances == 0 and _bonuses == 0:
            return jsonify({"status": False, "message": "No payments found for given month"}), 200

        cursor = await db.execute("SELECT name, pan, aadhar, designation FROM Staff WHERE id = (?)", (data['id'], ))
        staff_data = await cursor.fetchone()
        name, pan, aadhar, designation = staff_data

        async with aiosqlite.connect("hotel.db") as db:
            cursor = await db.execute("SELECT name FROM Hotel")
            hotel_name = (await cursor.fetchone())[0]

            await bill.generate_payslip(hotel_name, data['id'], name, pan, aadhar, designation, datetime(1, data['month'], 1).strftime("%B") + str(data['year']), base_salary if base_salary != 0 else None, _advances if _advances != 0 else None, _bonuses if _bonuses != 0 else None)

            with open(f"payslip{data['id']}.pdf", "rb") as pdf_file:
                encoded_string = base64.b64encode(pdf_file.read())

            os.remove(f"payslip{data['id']}.pdf")
            os.remove(f"payslip{data['id']}.xlsx")

            return jsonify({"status": True, "file": f"data:application/pdf;base64,{encoded_string.decode()}"})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500




    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT status, amount, month, year, time FROM StaffSalary WHERE id = (?) AND time >= (?) AND time <= (?)", (data['id'], data['from'], data['to']))
        payments = await cursor.fetchall()
        payments_data = []
        for i in payments:
            payments_data.append([i[4], i[0].title(), datetime(1, i[2], 1).strftime("%B"), i[3], i[1]])

        cursor = await db.execute("SELECT name FROM Staff WHERE id = (?)", (data['id'], ))
        name = (await cursor.fetchone())[0]

        async with aiosqlite.connect("hotel.db") as db2:
            cursor = await db2.execute("SELECT name FROM Hotel")
            hotel_name = (await cursor.fetchone())[0]

            await bill.generate_staff_report(hotel_name, data['id'], name, payments_data)

            with open(f"payslip{data['id']}.pdf", "rb") as pdf_file:
                encoded_string = base64.b64encode(pdf_file.read())

            os.remove(f"payslip{data['id']}.pdf")
            os.remove(f"payslip{data['id']}.xlsx")

            return jsonify({"status": True, "file": f"data:application/pdf;base64,{encoded_string.decode()}"})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_payments")
async def staff_payments():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("id") == None or data.get("from") == None or data.get("to") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    _from = datetime.fromtimestamp(data['from'])
    _to = datetime.fromtimestamp(data['to'])
    date_range = pd.date_range(*(pd.to_datetime([_from, _to]) + pd.offsets.MonthEnd()), freq='MS').strftime("%m/%Y").tolist()
    payments = {}
    async with aiosqlite.connect("staff.db") as db:
        for i in date_range:
            month, year = i.split("/")
            cursor = await db.execute("SELECT status, amount FROM StaffSalary WHERE id = (?) AND month = (?) AND year = (?)", (data['id'], month, year))
            _payments = await cursor.fetchall()
            for payment in _payments:
                if month not in payments:
                    payments[month] = {"advances": 0, "salary": 0, "salary_status": "unpaid"}
                    if payment[0] == "salary":
                        payments[month]["salary"] += int(payment[1])
                        payments[month]["salary_status"] = "paid"
                    elif payment[0] == "advance":
                        payments[month]["advances"] += int(payment[1])
                else:
                    if payment[0] == "salary":
                        payments[month]["salary"] += int(payment[1])
                        payments[month]["salary_status"] = "paid"
                    elif payment[0] == "advance":
                        payments[month]["advances"] += int(payment[1])

        return jsonify({"status": True, "payment_data": payments})
    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/staff_attendance_data", methods=["POST"])
async def get_staff_attendance_data():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("query") == None or data.get("id") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if data['query'] == "custom" and (data.get("from") == None or data.get("to") == None):
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    id_avail = await check_staff_id(data['id'])
    if id_avail:
        return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

    if data['query'] == "1m":
        to = datetime.now()
        _from = to - timedelta(days=int(to.strftime("%d"))-1)
    elif data['query'] == "1ml":
        to = datetime.now() - timedelta(days=int(datetime.now().strftime("%d")))
        _from = to - timedelta(days=int(to.strftime("%d"))-1)
    elif data['query'] == "3m":
        to = datetime.now() - timedelta(days=int(datetime.now().strftime("%d")))
        _from = to - timedelta(days=int(to.strftime("%d")))
        for i in range(2):
            _from -= timedelta(days=int(_from.strftime("%d")))
        _from += timedelta(days=1)
    elif data['query'] == "6m":
        to = datetime.now() - timedelta(days=int(datetime.now().strftime("%d")))
        _from = to - timedelta(days=int(to.strftime("%d")))
        for i in range(5):
            _from -= timedelta(days=int(_from.strftime("%d")))
        _from += timedelta(days=1)
    elif data['query'] == "1y":
        to = datetime.now()
        _from = datetime.strptime(f"01/01/{to.strftime('%Y')}", "%d/%m/%Y")
    elif data['query'] == "custom":
        _from = datetime.fromtimestamp(data['from'])
        to = datetime.fromtimestamp(data['to'])

    days = list(map(lambda x: x.strftime("%d/%m/%Y"), [_from + timedelta(days=i) for i in range((to + timedelta(days=1) - _from).days)]))

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT log_date, status, leave_type FROM StaffLog WHERE id = (?)", (data['id'], ))
        entries = await cursor.fetchall()
        attendance_data = {}
        for i in entries:
            if i[0] not in days:
                continue
            key = i[0][3:]
            if key not in attendance_data:
                attendance_data[key] = {}

            attendance_data[key][i[0]] = {"status": i[1], "leave_type": i[2]}
        for i in days:
            if i[3:] not in attendance_data:
                attendance_data[i[3:]] = {}
        return jsonify({"status": True, "attendance_data": attendance_data})
    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

# @app.route("/staff_details", methods=["GET"])
# async def get_staff_details():
#     data = request.json

#     headers = request.headers
#     if headers.get("cookie") == None:
#         return jsonify({"status": False, "message": "Unauthorized"}), 401

#     if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
#         return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

#     data['token'] = headers['cookie'].split("=")[1]

#     if data.get("id") == None:
#         return jsonify({"status": False, "message": "Invalid Parameters"}), 400

#     id_avail = await check_staff_id(data['id'])
#     if id_avail:
#         return jsonify({"status": False, "message": "ID not available\nPlease enter another ID"}), 400

#     async with aiosqlite.connect("staff.db") as db:
#         cursor = await db.execute("SELECT * FROM Staff WHERE id = (?)", (data['id'], ))
#         staff_data = await cursor.fetchone()
#         return jsonify({"status": True, "staff_data": {"name": staff_data[0], "id": staff_data[1], "spm": staff_data[2], "sick_leaves": staff_data[3], "casual_leaves": staff_data[4], "special_leaves": staff_data[5]}})

#     return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/records", methods=["POST", "GET"])
async def get_record():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("searchby") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    if data['searchby'] not in ("name", "phone_num", "txn_id", "identity", "room_num", "date"):
        return jsonify({"status": False, "message": "Invalid Search Parameter"}), 400

    _from = 0
    _to = 9999999999
    if data.get("from"):
        if not (data['from'] == ""):
            _from = int(data['from'])
    if data.get("to"):
        if not (data['to'] == ""):
            _to = int(data['to'])

    data['query'] = "%" + data['query'] + "%"


    async with aiosqlite.connect("record.db") as db:
        if data['searchby'] == "name":
            cursor = await db.execute("SELECT * FROM Users WHERE name LIKE (?)", (data['query'], ))
        elif data['searchby'] == "phone_num":
            cursor = await db.execute("SELECT * FROM Users WHERE phone_num LIKE(?)", (data['query'], ))
        elif data['searchby'] == "room_num":
            cursor = await db.execute("SELECT * FROM Users WHERE room_num LIKE (?)", (data['query'], ))
        elif data['searchby'] == "txn_id":
            cursor = await db.execute("SELECT * FROM Users WHERE txn_id LIKE (?)", (data['query'], ))
        elif data['searchby'] == "identity":
            cursor = await db.execute("SELECT * FROM Users WHERE identity LIKE (?)", (data['query'], ))
        elif data['searchby'] == "date":
            cursor = await db.execute("SELECT * FROM Users")
        _records = await cursor.fetchall()
        records = []
        for i in _records:
            if _from != 0 and _to != 9999999999:
                stay_from = datetime.fromtimestamp(i[7])
                stay_to = datetime.fromtimestamp(i[8])
                _stayed = [stay_from + timedelta(days=x) for x in range((stay_to + timedelta(days=1) - stay_from).days)]
                _days = [datetime.fromtimestamp(_from) + timedelta(days=x) for x in range((datetime.fromtimestamp(_to) + timedelta(days=1) - datetime.fromtimestamp(_from)).days)]
                stayed = []
                days = []
                for day in _stayed:
                    stayed.append(day.strftime("%d/%m/%Y"))
                for day in _days:
                    days.append(day.strftime("%d/%m/%Y"))
                stayed = set(stayed)
                days = set(days)
                del _stayed
                del _days
                if len(days.intersection(stayed)) == 0:
                    continue

            # if not(_from <= i[7] and _to >= i[8]):
            #     _records.remove(i)
            days = (datetime.fromtimestamp(i[8]) - datetime.fromtimestamp(i[7])).days
            if days == 0:
                room_total = i[6]
            else:
                room_total = i[6] * days

            food_items = json.loads(i[10].replace("'", '"'))
            for item in food_items:
                room_total += item[4]

            cgst = room_total * CGST_PER
            sgst = room_total * SGST_PER
            room_total += cgst
            room_total += sgst

            customer_data = {"name": i[0], "room_num": i[1], "members": i[2], "phone_num": i[3], "identity": i[4], "food": i[5], "ppn": i[6], "from": datetime.fromtimestamp(i[7]).strftime("%d/%m/%Y"), "to": datetime.fromtimestamp(i[8]).strftime("%d/%m/%Y"), "txn_id": i[9], "food_items": food_items, "total_invoice_value": room_total, "gstn": i[11], "advance": i[12]}
            customer_data['documents'] = {}
            for doc, name in zip(json.loads(i[13]), json.loads(i[14])):
                customer_data['documents'][name] = "data:application/pdf;base64," + doc

            records.append(customer_data)

        return jsonify({"status": True, "records": records}), 200




        # if data.get("name") == None and data.get("txn_id") == None:
        #     cursor = await db.execute("SELECT * FROM Users")
        #     records = await cursor.fetchall()
        #     for i in records:
        #         if not(_from <= i[7] and _to >= i[8]):
        #             records.remove(i)
        #     return jsonify({"status": True, "records": records}), 200
        # elif data.get("name") != None and data.get("txn_id") == None:
        #     cursor = await db.execute("SELECT * FROM Users WHERE name = (?)", (data['name'], ))
        #     records = await cursor.fetchall()
        #     for i in records:
        #         if not(_from <= i[7] and _to >= i[8]):
        #             records.remove(i)
        #     return jsonify({"status": True, "records": records}), 200
        # elif data.get("name") != None and data.get("txn_id") != None:
        #     cursor = await db.execute("SELECT * FROM Users WHERE name = (?) AND txn_id = (?)", (data['name'], data['txn_id']))
        #     records = await cursor.fetchall()
        #     for i in records:
        #         if not(_from <= i[7] and _to >= i[8]):
        #             records.remove(i)
        #     return jsonify({"status": True, "records": records}), 200
        # elif data.get("name") == None and data.get("txn_id") != None:
        #     cursor = await db.execute("SELECT * FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        #     records = await cursor.fetchall()
        #     for i in records:
        #         if not(_from <= i[7] and _to >= i[8]):
        #             records.remove(i)
        #     return jsonify({"status": True, "records": records}), 200
    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/get_sales", methods=["POST"])
async def get_sales():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("search_term") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400


    data['token'] = headers['cookie'].split("=")[1]

    _from = 0
    _to = 9999999999
    if data.get("from"):
        if not (data['from'] == ""):
            _from = int(data['from'])
    if data.get("to"):
        if not (data['to'] == ""):
            _to = int(data['to'])

    async with aiosqlite.connect("sales.db") as db:
        cursor = await db.execute("SELECT * FROM Sales")
        _sales = await cursor.fetchall()
        from_date = datetime.fromtimestamp(_from)
        to_date = datetime.fromtimestamp(_to)
        sales = {}
        for i in _sales:
            sale_date = datetime(i[2], i[1], i[0])
            if not (from_date <= sale_date <= to_date):
                continue
            if data['search_term'] in ("today", "this-week", "this-month"):
                if str(sale_date)[:10] not in sales:
                    sales[str(sale_date)[:10]] = 0
                sales[str(sale_date)[:10]] += int(i[3])
            elif data['search_term'] in ("six-months", "this-year", "lifetime"):
                if str(sale_date)[:7] not in sales:
                    sales[str(sale_date)[:7]] = 0
                sales[str(sale_date)[:7]] += int(i[3])
        return jsonify({"status": True, "sales": sales}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/get_advance", methods=["POST"])
async def get_advance():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("search_term") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400


    data['token'] = headers['cookie'].split("=")[1]

    _from = 0
    _to = 9999999999
    if data.get("from"):
        if not (data['from'] == ""):
            _from = int(data['from'])
    if data.get("to"):
        if not (data['to'] == ""):
            _to = int(data['to'])

    async with aiosqlite.connect("sales.db") as db:
        cursor = await db.execute("SELECT * FROM Advance")
        _advance = await cursor.fetchall()
        from_date = datetime.fromtimestamp(_from)
        to_date = datetime.fromtimestamp(_to)
        advance = {}
        for i in _advance:
            advance_date = datetime(i[2], i[1], i[0])
            if not (from_date <= advance_date <= to_date):
                continue
            if data['search_term'] in ("today", "this-week", "this-month"):
                if str(advance_date)[:10] not in advance:
                    advance[str(advance_date)[:10]] = 0
                advance[str(advance_date)[:10]] += int(i[3])
            elif data['search_term'] in ("six-months", "this-year", "lifetime"):
                if str(advance_date)[:7] not in advance:
                    advance[str(advance_date)[:7]] = 0
                advance[str(advance_date)[:7]] += int(i[3])
        return jsonify({"status": True, "advance": advance}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/recent_customers")
async def get_recent_customers():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT name, room_num, txn_id FROM Users ORDER BY txn_id DESC LIMIT 10")
        _data = await cursor.fetchall()
        data = list(map(lambda x: {"name": x[0], "room_num": x[1], "time": x[2].replace("TXN", "")}, _data))
        return jsonify({"status": True, "data": data})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    

@app.route("/occupied_rooms", methods=["POST"])
async def get_occupied_rooms():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("from") == None or data.get("to") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute('SELECT room_num, members, ppn, name, txn_id FROM Users WHERE "from" <= (?) AND "to" >= (?)', (int(data['from']), int(data['from'])))
        occupied = await cursor.fetchall()
        rooms = []
        for i in occupied:
            rooms.append({"room_num": i[0], "members": i[1], "ppn": i[2], "name": i[3], "txn_id": i[4]})
        return jsonify({"status": True, "occupied_rooms": rooms})
    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    
@app.route("/tete", methods=["POST", "GET"])
async def tete():
    data = request.json
    # t = "TXN20230726055212"
    # async with aiosqlite.connect("record.db") as db:
    #     cursor = await db.execute("SELECT documents, documents_names FROM Users WHERE txn_id = (?)", (t,))
    #     data = await cursor.fetchone()
    #     docs = json.loads(data[0])
    #     docs_names = json.loads(data[1])
    #     for doc, name in zip(docs, docs_names):
    #         with open(name, "wb") as f:
    #             f.write(base64.b64decode(doc))
    room_available_l = []
    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute('SELECT "from", "to" FROM Users WHERE room_num = (?)', ("102", ))
        room_data = await cursor.fetchall()
        for i in room_data:
            if i[0] <= int(data['from']) <= i[1]:
                print(i[0], i[1])

                print(1)
                room_available_l.append(False)
            elif int(data['from']) <= i[0] <= int(data['to']):
                print(i[0], i[1])

                print(2)
                room_available_l.append(False)

    return jsonify(room_available_l)

# @app.route("/tete2")
# async def tete2():
#     # with open("we.pdf", 'rb') as f:
#     #     blob = f.read()

#     # with open("we2.pdf", 'rb') as f:
#     #     blob2 = f.read()

#     # docs = str([blob, blob2])

#     async with aiosqlite.connect("hotel.db") as db:
#         cursor = await db.execute("SELECT documents FROM Users WHERE txn_id = (?)", ("TXN20231207165356", ))
#         files = json.loads((await cursor.fetchone())[0])
#         for i in range(len(files)):
#             with open(f'{i}.pdf', 'wb') as f:
#                 f.write(bytes(files[i], "utf-8"))
#         return 'done'

@app.route("/generate_invoice", methods=["POST"])
async def generate_invoice():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("txn_id") == None:
        return jsonify({"status": False, "message": "No Transaction ID passed"}), 400

    async with aiosqlite.connect("record.db") as db:
        cursor = await db.execute("SELECT name FROM Users WHERE txn_id = (?)", (data['txn_id'], ))
        name = await cursor.fetchone()
        if name == None:
            return jsonify({"status": False, "message": "Invalid Transaction ID"}), 200
        # generate_bill(invoice_no, hotel_name, owner, city, address, phone_num, hotel_gstn, email, customer, cust_gstn, cust_pan, date, items)
        """
        {"hotel_name": hotel_data[0], "gstn": hotel_data[1], "address": hotel_data[2], "city": hotel_data[3], "state": hotel_data[4], "phone_num": hotel_data[5], "email": hotel_data[6], "bf_price": hotel_data[7], "lunch_price": hotel_data[8], "dinner_price": hotel_data[9], "owner": hotel_data[10]}
        """
        invoice_no = data['txn_id']

        hotel_data = (await _get_hotel_details())['hotel_details']
        hotel_name = hotel_data['hotel_name']
        owner = hotel_data['owner']
        city = hotel_data['city']
        address = hotel_data['address']
        phone_num = hotel_data['phone_num']
        hotel_gstn = hotel_data['gstn']
        email = hotel_data['email']


        cursor = await db.execute('SELECT name, gstn, identity, "to", orders, ppn, room_num, "from" FROM Users WHERE txn_id = (?)', (data['txn_id'], ))
        customer_data = await cursor.fetchone()
        customer = customer_data[0]
        cust_gstn = customer_data[1] or ""
        cust_pan = customer_data[2]
        date = int(time.time())
        items = json.loads(customer_data[4].replace("'", '"'))

        ppn = int(customer_data[5])
        room_num = customer_data[6]
        _to = int(customer_data[3])
        _from = int(customer_data[7])

        days = (datetime.fromtimestamp(_to) - datetime.fromtimestamp(_from)).days
        if days == 0:
            room_total = ppn
        else:
            room_total = ppn * days

        async with aiosqlite.connect("hotel.db") as db2:
            cursor = await db2.execute("SELECT type FROM Rooms WHERE room_num = (?)", (room_num, ))
            room_type = (await cursor.fetchone())[0]

        items.insert(0, ["", room_type + " Room", HSN, ppn, days, room_total])


        await bill.generate_bill(invoice_no, hotel_name, owner, city, address, phone_num, hotel_gstn, email, customer, cust_gstn, cust_pan, date, items)


        with open(f"bill{data['txn_id']}.pdf", "rb") as pdf_file:
            encoded_string = base64.b64encode(pdf_file.read())

        return jsonify({"status": True, "file": f"data:application/pdf;base64,{encoded_string.decode()}"})


@app.route("/add_room", methods=["POST"])
async def add_room():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("room_num") == None or data.get("floor_num") == None or data.get("capacity") == None or data.get("type") == None or data.get("ppn") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT ppn FROM Rooms WHERE room_num = (?) AND floor_num = (?)", (data['room_num'], data['floor_num']))
        room_data = await cursor.fetchone()
        if room_data != None:
            return jsonify({"status": False, "message": "Room already exists"}), 400
        await db.execute("INSERT INTO Rooms VALUES (?, ?, ?, ?, ?)", (data['room_num'], data['type'], data['ppn'], data['capacity'], data['floor_num']))
        await db.commit()
        return jsonify({"status": True, "message": "Room added successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/delete_room", methods=["POST"])
async def delete_room():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]
    print(data)

    if data.get("room_num") == None or data.get("floor_num") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("DELETE FROM Rooms WHERE room_num = (?) AND floor_num = (?)", (data['room_num'], data['floor_num']))
        await db.commit()
        return jsonify({"status": True, "message": "Room deleted successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/room", methods=["POST"])
async def get_room_details():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("floor_num") == None or data.get("room_num") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT type, ppn, capacity FROM Rooms WHERE room_num = (?) AND floor_num = (?)", (data['room_num'], data['floor_num']))
        room_data = await cursor.fetchone()
        if room_data == None:
            return jsonify({"status": False, "message": "No Room found"}), 400
        return jsonify({"status": True, "data": {"room_num": data['room_num'], "floor_num": data['floor_num'], "type": room_data[0], "ppn": room_data[1], "capacity": room_data[2]}}), 200
    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/rooms", methods=["POST"])
async def get_rooms():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("floor_num") == None:
        data['floor_num'] = "ALL"

    async with aiosqlite.connect("hotel.db") as db:
        if data['floor_num'] != "ALL":
            cursor = await db.execute("SELECT * FROM Rooms WHERE floor_num = (?)", (data['floor_num'], ))
            rooms = await cursor.fetchall()
            room_data = {}
            for i in rooms:
                if i[4] not in room_data:
                    room_data[i[4]] = []
                room_data[i[4]].append({"room_num": i[0], "type": i[1], "ppn": i[2], "capacity": i[3]})
        else:
            cursor = await db.execute("SELECT * FROM Rooms")
            rooms = await cursor.fetchall()
            room_data = {}
            for i in rooms:
                if i[4] not in room_data:
                    room_data[i[4]] = []
                room_data[i[4]].append({"room_num": i[0], "type": i[1], "ppn": i[2], "capacity": i[3]})

        return jsonify({"status": True, "rooms": room_data}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/modify_room", methods=["POST"])
async def modify_room():
    data = request.json

    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    data['token'] = headers['cookie'].split("=")[1]

    if data.get("room_num") == None or data.get("floor_num") == None or data.get("ppn") == None or data.get("capacity") == None or data.get("type") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("hotel.db") as db:
        await db.execute("UPDATE Rooms SET ppn = (?), capacity = (?), type = (?) WHERE room_num = (?) AND floor_num = (?)", (data['ppn'], data['capacity'], data['type'], data['room_num'], data['floor_num']))
        await db.commit()
        return jsonify({"status": True, "message": "Room details updated successfully"}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/room_types")
async def get_room_types():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT DISTINCT type FROM Rooms")
        types = await cursor.fetchall()
        room_types = list(map(lambda x: x[0], types))
        return jsonify({"status": True, "room_types": room_types}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/floors")
async def get_floors():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("hotel.db") as db:
        cursor = await db.execute("SELECT DISTINCT floor_num FROM Rooms")
        _floors = await cursor.fetchall()
        floors = list(map(lambda x: x[0], _floors))
        return jsonify({"status": True, "floors": floors}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500

@app.route("/unique_customers", methods=["POST"])
async def get_unique_customers():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("query") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    data['query'] = "%" + data['query'] + "%"

    async with aiosqlite.connect("record.db") as db:
        cursor = await db.execute("SELECT DISTINCT name FROM Users WHERE name LIKE (?)", (data['query'], ))
        names = await cursor.fetchall()
        names = list(map(lambda x: x[0], names))
        return jsonify({"status": True, "names": names})

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500


@app.route("/customer_details", methods=["POST"])
async def get_customer_details():
    data = request.json
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    if data.get("query") == None:
        return jsonify({"status": False, "message": "Invalid Parameters"}), 400

    async with aiosqlite.connect("record.db") as db:
        cursor = await db.execute("SELECT phone_num, identity, gstn, documents, documents_names FROM Users WHERE name = (?)", (data['query'], ))
        _customer_data = await cursor.fetchone()
        if _customer_data == None:
            return jsonify({"status": True, "details": {}}), 200
        customer_data = {}
        customer_data['phone_num'] = _customer_data[0].replace("+91", "")
        customer_data['identity'] = _customer_data[1]
        customer_data['gstn'] = _customer_data[2]
        customer_data['documents'] = {}
        for doc, name in zip(json.loads(_customer_data[3]), json.loads(_customer_data[4])):
            customer_data['documents'][name] = "data:application/pdf;base64," + doc
        return jsonify({"status": True, "details": customer_data}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500
    

@app.route("/staff_designations")
async def get_staff_designations():
    headers = request.headers
    if headers.get("cookie") == None:
        return jsonify({"status": False, "message": "Unauthorized"}), 401

    if not (await verify_token(headers['cookie'].split("=")[1]))['status']:
        return jsonify({"status": False, "message": "Invalid Auth Token"}), 401

    async with aiosqlite.connect("staff.db") as db:
        cursor = await db.execute("SELECT DISTINCT designation FROM Staff")
        designations = await cursor.fetchall()
        designations = list(map(lambda x: x[0], designations))
        return jsonify({"status": True, "designations": designations}), 200

    return jsonify({"status": False, "message": "Server Error\nTry again later"}), 500




app.run(port=8080, debug=True)
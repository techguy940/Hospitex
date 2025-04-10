import xlsxwriter
from win32com import client
import os
from datetime import datetime
import pythoncom

async def save_as_pdf(filename):
	pythoncom.CoInitialize()
	xlApp = client.Dispatch("Excel.Application")
	cwd = os.getcwd()
	books = xlApp.Workbooks.Open(f'{cwd}\\{filename}.xlsx')
	ws = books.Worksheets[0]
	ws.Visible = 1
	ws.ExportAsFixedFormat(0, f'{cwd}\\{filename}.pdf')
	books.Close(SaveChanges=0)
	xlApp.Quit()
	pythoncom.CoUninitialize()
	del xlApp

HSN = 996332
async def generate_bill(invoice_no, hotel_name, owner, city, address, phone_num, hotel_gstn, email, customer, cust_gstn, cust_pan, date, items):
	workbook = xlsxwriter.Workbook(f'bill{invoice_no}.xlsx')
	worksheet = workbook.add_worksheet()
	# worksheet.print_area("A1:F36")
	worksheet.fit_to_pages(1, 2)


	worksheet.center_horizontally()

	worksheet.write("A6", city)
	worksheet.write("F6", f"Mob: {phone_num}")
	worksheet.write("A7", f"GSTN: {hotel_gstn}")
	worksheet.write("F7", f"Email: {email}")

	worksheet.write("A9", f"To: {customer}")
	worksheet.write("A10", f"GSTN: {cust_gstn}")
	worksheet.write("A11", f"Place of Supply: {city}")
	worksheet.write("A12", f"State Code: {cust_gstn[:2]}")
	worksheet.write("A13", f"PAN: {cust_pan}")

	date = datetime.fromtimestamp(date)
	year = int(date.strftime('%Y')[-2:])
	# {hotel_name[:2].upper()}{invoice_no}/{year}-{year+1}
	worksheet.write("F9", f"Invoice No.: {invoice_no}")
	worksheet.write("F10", f"Date & Time: {date.strftime('%d/%m/%Y %H:%M:%S')}")

	header_format = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center"})

	worksheet.write("A15", "Date", header_format)
	worksheet.write("B15", "Particulars", header_format)
	worksheet.write("C15", "HSN", header_format)
	worksheet.write("D15", "Rate", header_format)
	worksheet.write("E15", "Qty/ Nights", header_format)
	worksheet.write("F15", "Amount (Rs.)", header_format)
	# worksheet.write("F15", "Amount (Rs.)", header_format)

	border_format = workbook.add_format({"border": 1})
	# automate
	total = len(items) + 5
	end = total + 15
	worksheet.conditional_format(f"A15:F{end}", {"type": "no_errors", "format": border_format})

	end_format = workbook.add_format({"valign": "vcenter", "align": "center"})
	curr = 16
	rows = "ABCDEF"

	for item in items:
		for idx, name in enumerate(item):
			worksheet.write(f"{rows[idx]}{curr}", name, end_format)
		curr += 1

	worksheet.write(f"F{end}", f"=SUM(F16:F{end-1})", workbook.add_format({"bold": True, "valign": "center", "align": "center"}))

	worksheet.write(f"B{end-1}", "SGST (9%)", end_format)
	worksheet.write(f"F{end-1}", f"=SUM(F15:F{end-3})*9%", end_format)

	worksheet.write(f"B{end-2}", "CGST (9%)", end_format)
	worksheet.write(f"F{end-2}", f"=SUM(F15:F{end-3})*9%", end_format)


	# automate
	worksheet.write(f"F{end+6}", f"For {hotel_name}", end_format)
	worksheet.write(f"F{end+7}", owner, end_format)
	worksheet.write(f"F{end+8}", "(Director)", end_format)

	worksheet.autofit()

	# automate
	worksheet.write(f"A{end+3}", f"This invoice is subject to {city} Jurisdiction.")
	worksheet.write(f"A{end+4}", "Interest @18% p.a. shall be charged if amount not paid within 30 days.")


	merge_format = workbook.add_format({"valign": "vcenter", "align": "center", "bold": True})
	worksheet.merge_range(f"A{end}:E{end}", "Total Invoice Value", merge_format)

	merge_format = workbook.add_format({"valign": "vcenter", "align": "center", "font_size": 20})
	worksheet.merge_range("A1:F1", "Tax Invoice", merge_format)

	merge_format = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center", "font_size": 20})
	worksheet.merge_range("A2:F2", hotel_name, merge_format)

	merge_format = workbook.add_format({"valign": "vcenter", "align": "center", "font_size": 12, "text_wrap": True})
	worksheet.merge_range("A3:F5", address, merge_format)

	workbook.close()
	await save_as_pdf(f"bill{invoice_no}")
	# os.remove(os.getcwd()+f"\\bill{invoice_no}.xlsx")

async def generate_staff_report(hotel_name, staff_id, staff_name, data):
	workbook = xlsxwriter.Workbook(f'report{staff_id}.xlsx')
	worksheet = workbook.add_worksheet()
	worksheet.center_horizontally()

	bold = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center"})
	center = workbook.add_format({"valign": "vcenter", "align": "center"})

	worksheet.write("B6", "Sr. No", bold)
	worksheet.write("C6", "Date & Time", bold)
	worksheet.write("D6", "Payment Type", bold)
	worksheet.write("E6", "Month", bold)
	worksheet.write("F6", "Year", bold)
	worksheet.write("G6", "Amount (₹)", bold)

	curr = 1
	offset = 6

	border_format = workbook.add_format({"border": 1})
	total = len(data)
	worksheet.conditional_format(f"B{curr + offset - 1}:G{total + offset}", {"type": "no_errors", "format": border_format})

	for i in data:
		worksheet.write(f"B{curr + offset}", curr, center)
		worksheet.write(f"C{curr + offset}", datetime.fromtimestamp(i[0]).strftime("%d/%m/%Y %H:%M %p"), center)
		worksheet.write(f"D{curr + offset}", i[1], center)
		worksheet.write(f"E{curr + offset}", i[2], center)
		worksheet.write(f"F{curr + offset}", i[3], center)
		worksheet.write(f"G{curr + offset}", "₹ " + str(i[4]), center)
		curr += 1

	worksheet.autofit()

	merge_format = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center", "font_size": 20})
	worksheet.merge_range("A1:H2", hotel_name, merge_format)

	merge_format = workbook.add_format({"valign": "vcenter", "align": "center", "font_size": 12})
	worksheet.merge_range("A4:H4", f"Payment report for {staff_id} ({staff_name})", merge_format)

	workbook.close()
	await save_as_pdf(f"report{staff_id}")

async def generate_payslip(hotel_name, staff_id, staff_name, staff_pan, staff_aadhar, staff_designation, month, staff_base_salary=None, advance=None, bonus=None):
	workbook = xlsxwriter.Workbook(f'payslip{staff_id}.xlsx')
	worksheet = workbook.add_worksheet()
	worksheet.center_horizontally()

	bold = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center"})
	center = workbook.add_format({"valign": "vcenter", "align": "center"})

	worksheet.write("A4", "Name: ")
	worksheet.write("A5", "Employee ID: ")
	worksheet.write("A6", "Designation: ")
	worksheet.write("A7", "PAN: ")
	worksheet.write("A8", "Aadhar No.: ")

	worksheet.write("B4", staff_name)
	worksheet.write("B5", staff_id)
	worksheet.write("B6", staff_designation)
	worksheet.write("B7", staff_pan)
	worksheet.write("B8", staff_aadhar)

	worksheet.write("C4", "Date: ")
	worksheet.write("C5", "Month: ")

	worksheet.write("D4", datetime.now().strftime("%d/%m/%Y"))
	worksheet.write("D5", month)

	merge_format = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center"})
	right = workbook.add_format({"align": "right"})

	worksheet.merge_range("A10:B10", "Particulars", merge_format)
	worksheet.merge_range("C10:D10", "Amount (₹)", merge_format)


	cur = 11

	if staff_base_salary:
		worksheet.merge_range(f"A{cur}:B{cur}", "Base Salary")
		worksheet.merge_range(f"C{cur}:D{cur}", "₹ " + str(staff_base_salary), right)
		cur += 1

	if advance:
		worksheet.merge_range(f"A{cur}:B{cur}", "Less: Advance")
		worksheet.merge_range(f"C{cur}:D{cur}", "₹ " + str(advance), right)
		cur += 1

	if bonus:
		worksheet.merge_range(f"A{cur}:B{cur}", "Add: Bonus")
		worksheet.merge_range(f"C{cur}:D{cur}", "₹ " + str(bonus), right)
		cur += 1

	net_salary = (staff_base_salary or 0) - (advance or 0) + (bonus or 0)

	worksheet.merge_range(f"A{cur}:B{cur}", "")
	worksheet.merge_range(f"C{cur}:D{cur}", "", )

	cur += 1
	worksheet.merge_range(f"A{cur}:B{cur}", "Net Salary for the Month")
	worksheet.merge_range(f"C{cur}:D{cur}", "₹ " + str(net_salary), bold)

	border_format = workbook.add_format({"border": 1})
	worksheet.conditional_format(f"A10:D{cur}", {"type": "no_errors", "format": border_format})

	worksheet.autofit()

	merge_format = workbook.add_format({"bold": True, "valign": "vcenter", "align": "center", "font_size": 20})
	worksheet.merge_range("A1:D2", hotel_name, merge_format)

	workbook.close()
	await save_as_pdf(f"payslip{staff_id}")


# items = [["","Super Deluxe Room", HSN, 3500, 1], ["15/07/2023", "Tea", HSN, 20, 4], ["15/07/2023", "Aloo Paratha", HSN, 80, 2], ["15/07/2023", "French Fries", HSN, 100, 1], ["16/07/2023", "Poha", HSN, 40, 2], ["17/07/2023", "Curd", HSN, 20, 2]]

# for i in items:
# 	i.append(i[3]*i[4])
# generate_bill("429", "Kotharis Hotels", "Poojan Kothari", "Ahmedabad", "Opp. Havmor Bar, Sindhubhavan Road, Bodakdev - 380014", "8238032889", "24DZMPK2312J1ZP", "kotharis_hotel@gmail.com", "Nirmit Shah", "25DZMPK4352J1ZP", "DZMPK4352J", 1688198358, items)
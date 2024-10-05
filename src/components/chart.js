import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";
  
function Chart(props) {
    return (
        <LineChart
            width={600}
            height={300}
            data={props.data}
            margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
            type="monotone"
            dataKey="Amount"
            stroke="#ff7300"
            activeDot={{ r: 8 }}
            />
        </LineChart>
    );
}

export default Chart
  
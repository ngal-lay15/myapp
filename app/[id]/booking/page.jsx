"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import table from '../../../img/table.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';

const Home = ({ params }) => {
    const [selectedTable, setSelectedTable] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
    const [bookedTables, setBookedTables] = useState([]);
    const [tableAttributes, setTableAttributes] = useState([]);
    const [timeValue, setTimeValue] = useState(''); // Initialize with an empty string
    const [existingBookings, setExistingBookings] = useState([]);

    useEffect(() => {
        const fetchBookedTables = async () => {
            const orderSnapshot = await getDocs(collection(db, '1/order/items'));
            const deliveredSnapshot = await getDocs(collection(db, '1/delivered/items'));
            const bookingSnapshot = await getDocs(collection(db, '1/booking/items'));
            
            const booked = orderSnapshot.docs.map(doc => doc.data());
            const attributes = deliveredSnapshot.docs.map(doc => doc.data());
            const bookings = bookingSnapshot.docs.map(doc => doc.data()); // Fetch existing bookings
    
            setBookedTables(booked);
            setTableAttributes(attributes);
            setExistingBookings(bookings); // Store existing bookings
        };
        fetchBookedTables();
    }, []);
    // Combine booked tables and table attributes into a single set of table numbers
    const getRedTables = () => {
        const bookedTableNumbers = new Set(bookedTables.map(table => parseInt(table.table)));
        const attributeTableNumbers = new Set(tableAttributes.map(attribute => parseInt(attribute.table)));
        return new Set([...bookedTableNumbers, ...attributeTableNumbers]);
    };

    const handleTableClick = (index) => {
        // if (!getRedTables().has(index + 1)) {
            setSelectedTable(index + 1);
        // }
    };
    const handleBooking = async () => {
        if (selectedTable) {
            const now = new Date();
            const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
            // Ensure that startDate is at least 2 hours ahead of the current time
            if (startDate <= now) {
                alert("Please select a start time greater than the current time.");
                return; // Exit the function to prevent booking
            }
    
            let adjustedEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default endDate if no overlap
    
            // Check for overlapping bookings for the same table
            const overlappingBooking = existingBookings.find(booking => {
                const existingStart = new Date(booking.startDate.seconds * 1000);
                const existingEnd = new Date(booking.endDate.seconds * 1000);
    
                // Define the time window for the chosen booking
                const choiceEndTime = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
                // Check if the new booking time overlaps with any existing booking for the same table
                return (
                    booking.table === selectedTable && // Check for the same table
                    ((startDate < existingEnd && choiceEndTime > existingStart) ||
                    (existingStart < choiceEndTime && existingEnd > startDate))
                );
            });
    
            if (overlappingBooking) {
                const overlapStartTime = new Date(overlappingBooking.startDate.seconds * 1000);
    
                // Adjust endDate to overlap end time
                adjustedEndDate = overlapStartTime;
    
                alert(`The selected time overlaps with an existing booking for the same table. The end time has been adjusted to ${overlapStartTime.toLocaleTimeString()}.`);
            }
    
            // Check for overlapping time ranges within the same time period
            const isTimeRangeOverlapping = existingBookings.some(booking => {
                const existingStart = new Date(booking.startDate.seconds * 1000);
                const existingEnd = new Date(booking.endDate.seconds * 1000);
    
                // Check if the existing booking overlaps with the selected time range
                return (
                    booking.table === selectedTable && // Check for the same table
                    (startDate < existingEnd && adjustedEndDate > existingStart)
                );
            });
    
            if (isTimeRangeOverlapping) {
                alert('The selected time range overlaps with an existing booking for the same table.');
            }
    
            // If the selected table is booked (red), ensure the start time is at least 2 hours ahead
            if (redTables.has(selectedTable)) {
                if (startDate <= twoHoursAhead) {
                    alert("Booking can only be made at least 2 hours in advance. Please select a later time.");
                    return; // Exit the function to prevent booking
                }
            }
    
            const phoneNumber = prompt('Please enter your phone number:');
    
            if (phoneNumber) {
                // Proceed with the confirmation dialog
                const confirmation = window.confirm(`Table ${selectedTable} will be booked from ${startDate.toLocaleTimeString()} to ${adjustedEndDate.toLocaleTimeString()}. Confirm?`);
    
                if (confirmation) {
                    try {
                        await addDoc(collection(db, '1/booking/items'), {
                            table: selectedTable,
                            startDate: startDate,
                            endDate: adjustedEndDate,
                            phoneNumber // Include the phone number in the booking data
                        });
                        alert('Booking successful!');
                    } catch (error) {
                        console.error("Error booking table: ", error);
                        alert('Booking failed, please try again.');
                    }
                }
            } else {
                alert('Phone number is required for booking.');
            }
        } else {
            alert('Please select a table first.');
        }
    };
    
    
    
    const handleTimeChange = (event) => {
        const time = event.target.value;
        setTimeValue(time);

        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
    
        // Create a new Date object for the selected time
        const newStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
        if (newStartDate <= now) {
            // If the selected time is not greater than the current time
            alert("Please select a time greater than the current time.");
            event.target.value = ''; // Optionally clear the input field
            return; // Exit the function to avoid updating the dates
        }

        if(redTables.has(selectedTable)){
            if (newStartDate <= now+ 2 * 60 * 60 * 1000) {
                // If the selected time is not greater than the current time
                alert("Please alery the current time.");
                event.target.value = ''; // Optionally clear the input field
                return; // Exit the function to avoid updating the dates
            }
    
        }
        // Update startDate and endDate if the time is valid
        setStartDate(newStartDate);
        setEndDate(new Date(newStartDate.getTime() + 2 * 60 * 60 * 1000));

    };
    

    const redTables = getRedTables();

    return (
        <div style={{ padding: '20px' }}>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '20px',
                    width: '100%'
                }}
            >
                {Array.from({ length: 10 }, (_, index) => (
                    <div
                        key={index}
                        style={{
                            width: '120px',
                            height: '120px',
                            border: '2px solid #01579b',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000000',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            // cursor: redTables.has(index + 1) ? 'not-allowed' : 'pointer',
                            backgroundColor: (selectedTable === index + 1 ? 'skyblue': redTables.has(index + 1) ? 'red'  : 'transparent')
                        }}
                        onClick={() => handleTableClick(index)}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                            <img src={table.src} alt="" style={{ width: '60px', height: '60px' }} />
                        </div>
                        Table {index + 1}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '20px'}}>
                <label htmlFor="start-time" style={{ marginRight: '10px' }}>Select Start Time:</label>
                <input
                    type="time"
                    id="start-time"
                    onChange={handleTimeChange}
                    style={{
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                    value={timeValue}
                    required
                />
            </div>
            <button
                onClick={handleBooking}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#01579b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                }}
            >
                Book Table
            </button>

            
        </div>
    );
};

export default Home;

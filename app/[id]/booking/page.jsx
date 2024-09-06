"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import table from '../../../img/table.png';
import '../../../globals.css';
import '../../../table.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2'; // Import SweetAlert2

const Home = ({ params }) => {
    const [selectedTable, setSelectedTable] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
    const [bookedTables, setBookedTables] = useState([]);
    const [tableAttributes, setTableAttributes] = useState([]);
    const [timeValue, setTimeValue] = useState('');
    const [existingBookings, setExistingBookings] = useState([]);

    useEffect(() => {
        const fetchBookedTables = async () => {
            const orderSnapshot = await getDocs(collection(db, '1/order/items'));
            const deliveredSnapshot = await getDocs(collection(db, '1/delivered/items'));
            const bookingSnapshot = await getDocs(collection(db, '1/booking/items'));
            
            const booked = orderSnapshot.docs.map(doc => doc.data());
            const attributes = deliveredSnapshot.docs.map(doc => doc.data());
            const bookings = bookingSnapshot.docs.map(doc => doc.data());
    
            setBookedTables(booked);
            setTableAttributes(attributes);
            setExistingBookings(bookings);
        };
        fetchBookedTables();
    }, []);

    const getRedTables = () => {
        const bookedTableNumbers = new Set(bookedTables.map(table => parseInt(table.table)));
        const attributeTableNumbers = new Set(tableAttributes.map(attribute => parseInt(attribute.table)));
        return new Set([...bookedTableNumbers, ...attributeTableNumbers]);
    };

    const handleTableClick = (index) => {
        setSelectedTable(index + 1);
    };

    const handleBooking = async () => {
        if (selectedTable) {
            const now = new Date();
            const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
            if (startDate <= now) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Time',
                    text: "Please select a start time greater than the current time.",
                    confirmButtonColor: '#ff9800', // Orange theme
                });
                return;
            }
    
            let adjustedEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            const overlappingBooking = existingBookings.find(booking => {
                const existingStart = new Date(booking.startDate.seconds * 1000);
                const existingEnd = new Date(booking.endDate.seconds * 1000);
                const choiceEndTime = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                return (
                    booking.table === selectedTable &&
                    ((startDate < existingStart && choiceEndTime > existingStart))
                );
            });

            if (getRedTables().has(selectedTable) && startDate <= twoHoursAhead) {
                Swal.fire({
                    icon: 'warning',
                    text: "စားသုံးသူများရှိနေပါသဖြင့် နောက်ထပ် အချိန် 2 နာရီခန့်မှ Booking တင်နိုင်ပါမည်",
                    confirmButtonColor: '#ff9800',
                });
                return;
            }

            const isTimeRangeOverlapping = existingBookings.some(booking => {
                const existingStart = new Date(booking.startDate.seconds * 1000);
                const existingEnd = new Date(booking.endDate.seconds * 1000);
                return (
                    booking.table === selectedTable &&
                    (startDate < existingEnd && startDate > existingStart)
                );
            });

            if (isTimeRangeOverlapping) {
                Swal.fire({
                    icon: 'warning',
                    text: 'ဤ Table အတွက် Booking ယူပြီးသားအချိန် ဖြစ်သောကြောင့် အခြား အချိန်အား ထပ်မံရွေးချယ်ပါ',
                    confirmButtonColor: '#ff9800',
                });
            } else if (overlappingBooking) {
                const overlapStartTime = new Date(overlappingBooking.startDate.seconds * 1000);
                adjustedEndDate = overlapStartTime;
                Swal.fire({
                    text: `${overlapStartTime.toLocaleTimeString()}. တွင် အခြား Booking ရှိသဖြင့် Booking ယူလိုလျှင် ${overlapStartTime.toLocaleTimeString()}  ထိသာရရှိမည် ဖြစ်ပါသည် `,
                    input: 'text',
                    inputPlaceholder: 'Your phone number',
                    confirmButtonColor: '#ff9800',
                    showCancelButton: true,
                }).then(async (result) => {
                    if (result.isConfirmed && result.value) {
                        const phoneNumber = result.value;
                        const confirmation = await Swal.fire({
                            title: `Confirm Booking`,
                            text: `Table ${selectedTable} will be booked from ${startDate.toLocaleTimeString()} to ${adjustedEndDate.toLocaleTimeString()}. Confirm?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ff9800',
                        });

                        if (confirmation.isConfirmed) {
                            try {
                                await addDoc(collection(db, '1/booking/items'), {
                                    table: selectedTable,
                                    startDate: startDate,
                                    endDate: adjustedEndDate,
                                    phoneNumber,
                                });
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Booking Successful',
                                    text: 'Your table has been booked!',
                                    confirmButtonColor: '#ff9800',
                                });
                            } catch (error) {
                                console.error("Error booking table: ", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Booking Failed',
                                    text: 'Please try again.',
                                    confirmButtonColor: '#ff9800',
                                });
                            }
                        }
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Phone Number Required',
                            text: 'Phone number is required for booking.',
                            confirmButtonColor: '#ff9800',
                        });
                    }
                });
            } else {
                Swal.fire({
                    title: 'Enter Phone Number',
                    input: 'text',
                    inputPlaceholder: 'Your phone number',
                    confirmButtonColor: '#ff9800',
                    showCancelButton: true,
                }).then(async (result) => {
                    if (result.isConfirmed && result.value) {
                        const phoneNumber = result.value;
                        const confirmation = await Swal.fire({
                            title: `Confirm Booking`,
                            text: `Table ${selectedTable} will be booked from ${startDate.toLocaleTimeString()} to ${adjustedEndDate.toLocaleTimeString()}. Confirm?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ff9800',
                        });

                        if (confirmation.isConfirmed) {
                            try {
                                await addDoc(collection(db, '1/booking/items'), {
                                    table: selectedTable,
                                    startDate: startDate,
                                    endDate: adjustedEndDate,
                                    phoneNumber,
                                });
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Booking Successful',
                                    text: 'Your table has been booked!',
                                    confirmButtonColor: '#ff9800',
                                });
                            } catch (error) {
                                console.error("Error booking table: ", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Booking Failed',
                                    text: 'Please try again.',
                                    confirmButtonColor: '#ff9800',
                                });
                            }
                        }
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Phone Number Required',
                            text: 'Phone number is required for booking.',
                            confirmButtonColor: '#ff9800',
                        });
                    }
                });
            }
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'No Table Selected',
                text: 'Please select a table first.',
                confirmButtonColor: '#ff9800',
            });
        }
    };

    const handleTimeChange = (event) => {
        const time = event.target.value;
        setTimeValue(time);

        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const newStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        if (newStartDate <= now) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Time',
                text: "Please select a time greater than the current time.",
                confirmButtonColor: '#ff9800',
            });
            event.target.value = '';
            return;
        }

        if (getRedTables().has(selectedTable) && newStartDate <= now + 2 * 60 * 60 * 1000) {
            Swal.fire({
                icon: 'warning',
                text: "Please select a time at least 2 hours in advance.",
                confirmButtonColor: '#ff9800',
            });
            event.target.value = '';
            return;
        }

        setStartDate(newStartDate);
        setEndDate(new Date(newStartDate.getTime() + 2 * 60 * 60 * 1000));
    };

    const redTables = getRedTables();

    return (
        <div className="container">
            <div className="table-grid">
                {Array.from({ length: 10 }, (_, index) => (
                    <div
                        key={index}
                        className={`table ${selectedTable === index + 1 ? 'selected' : redTables.has(index + 1) ? 'booked' : ''}`}
                        onClick={() => handleTableClick(index)}
                    >
                        <img src={table.src} alt="" />
                        Table {index + 1}
                    </div>
                ))}
            </div>
            <div className="start-time">
                <label htmlFor="start-time" style={{ marginRight: '10px' }}>Select Start Time:</label>
                <input
                    type="time"
                    id="start-time"
                    onChange={handleTimeChange}
                    value={timeValue}
                    required
                />
            </div>
            <button
                className="book-button"
                onClick={handleBooking}
            >
                Book Table
            </button>
        </div>
    );
};

export default Home;
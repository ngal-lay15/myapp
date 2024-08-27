"use client"
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useCart } from '../../../CartContext';
import { collection, addDoc,serverTimestamp } from "firebase/firestore";
import { db } from '../../firebaseConfig'; // Adjust the import path based on your project structure

const Home = ({ params }) => {
  const { cart, dispatch } = useCart();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Calculate the total price
  const totalPrice = cart.reduce((acc, item) => acc + Number(item.price), 0);

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }, (error) => {
        console.error("Error getting location:", error);
        setLocation("Location not available");
      });
    } else {
      setLocation("Geolocation is not supported by this browser.");
    }
  }, []);

  // Handle save order
  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      // Create an order with all items in the cart
      const orderData = {
        table: params.id, // Assuming static table number for now
        location: location || "Unknown", // Either use the location or fallback to "Unknown"
        orderlist: cart.map(item => ({
          name: item.name,
          price: Number(item.price),
        })),
        totalPrice: totalPrice,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, '1/order/items'), orderData);

      // Clear the cart after saving the order
      dispatch({ type: 'CLEAR_CART' });

      alert("Order saved successfully!");
    } catch (error) {
      console.error("Error saving order: ", error);
      alert("Failed to save the order. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <Header params={params.id} />
      <main>
        <h1>Your Menu</h1>
        {cart.map(item => (
          <div key={item.id}>
            <p>{item.name}</p>
            <p>${Number(item.price).toFixed(2)}</p>
          </div>
        ))}
        <div>
          <h2>Total Price: ${totalPrice.toFixed(2)}</h2>
        </div>
        <button onClick={handleSaveOrder} disabled={loading || !location}>
          {loading ? "Saving..." : "Save Order"}
        </button>
      </main>
    </div>
  );
};

export default Home;
